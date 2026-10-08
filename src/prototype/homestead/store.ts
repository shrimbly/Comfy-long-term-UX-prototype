// Implements: Homestead PRD P0.1–P0.8; all operations are local simulations.
import { defineStore } from 'pinia'
import { computed, onScopeDispose, ref, toRaw } from 'vue'
import { z } from 'zod'
import { desktopBuildPrompt, deploymentLinkSchema } from './agentModel'
import type { AgentRun, DesktopBuildRequest } from './agentModel'

import {
  buildPrompt,
  canSleep,
  compatibility,
  environments,
  seedWorkflows,
  transitionBuild
} from './model'
import type {
  BuildState,
  Environment,
  Job,
  Runtime,
  Version,
  Workflow
} from './model'

export const useHomesteadStore = defineStore('homestead-prototype', () => {
  const enabled = ref(window.location.pathname === '/prototype/homestead')
  const openRequest = ref(0)
  const workspaceName = ref('Northstar Studio')
  const projectId = ref<string | null>(null)
  const projectEnvironments = ref<Record<string, string>>({})
  const projectWorkflows = computed(() =>
    enabled.value
      ? workflows.value.filter((w) => w.projectId === projectId.value)
      : workflows.value
  )
  const version = ref<Version>(1)
  const view = ref<'home' | 'canvas' | 'environments' | 'projects'>('home')
  const entry = ref<'cloud' | 'desktop'>('cloud')
  const access = ref<'member' | 'admin' | 'outsider' | 'signedout'>('admin')
  const workflows = ref<Workflow[]>(seedWorkflows())
  const activeId = ref('product')
  const projectEnvironmentId = ref('studio')
  const availableEnvironments = ref<Environment[]>(
    structuredClone(environments)
  )
  const runtime = ref<Runtime>('sleeping')
  const build = ref<BuildState>({ phase: 'idle' })
  const buildSurface = ref<'agent' | 'platform' | 'manager'>('agent')
  const failure = ref<'none' | 'build' | 'deployment'>('none')
  const dialog = ref<
    | 'desktop'
    | 'nodesInfo'
    | 'outOfMemory'
    | 'import'
    | 'environment'
    | 'manager'
    | 'platform'
    | 'local'
    | 'logs'
    | 'update'
    | null
  >(null)
  const agentOpen = ref(false)
  const agentRun = ref<AgentRun | null>(null)
  const agentStep = ref(0)
  const agentUrl = computed(() => {
    if (!agentRun.value || build.value.phase !== 'ready') return null
    const url = new URL('/prototype/homestead', window.location.origin)
    url.searchParams.set('v', String(version.value))
    url.searchParams.set('deployment', build.value.environmentId)
    url.searchParams.set('workflow', agentRun.value.workflow.id)
    return url.href
  })
  const configOpen = ref(false)
  const importCase = ref<'compatible' | 'missing' | 'unknown'>('compatible')
  const selectedPacks = ref<string[]>([])
  const jobs = ref<Job[]>([])
  const warmEnvironments = new Set<string>()
  const activeJob = computed(() =>
    jobs.value.find(
      (job) => job.status === 'cold-start' || job.status === 'running'
    )
  )
  const notice = ref('')
  const idleMinutes = ref(3)
  const oom = ref(false)
  const pendingEnvironmentId = ref<string | null>(null)
  const editingEnvironmentId = ref<string | null>(null)
  const buildEnvironment = computed(
    () =>
      availableEnvironments.value.find(
        (e) => e.id === editingEnvironmentId.value
      ) ?? environment.value
  )
  const updateEnvironment = computed(() => {
    const state = build.value
    return state.phase === 'ready'
      ? availableEnvironments.value.find((e) => e.id === state.environmentId)
      : undefined
  })
  const cloudBuild = ref<{
    request: DesktopBuildRequest
    workflow: Workflow
    packs: string[]
    projectId: string | null
  } | null>(null)
  const buildProjectId = ref<string | null>(null)
  const buildWorkflowId = ref('product')
  const buildRequiredPacks = ref<string[]>([])
  const active = computed(
    () =>
      workflows.value.find((w) => w.id === activeId.value) ?? workflows.value[0]
  )
  const environment = computed(
    () =>
      availableEnvironments.value.find(
        (e) =>
          e.id ===
          (version.value === 3
            ? projectEnvironmentId.value
            : active.value.environmentId)
      ) ?? availableEnvironments.value[0]
  )
  const allowed = computed(
    () => access.value === 'admin' || access.value === 'member'
  )
  const editableBuild = computed(() => access.value === 'admin')
  const compatible = computed(() =>
    compatibility(active.value, environment.value)
  )
  const prompt = computed(() =>
    buildPrompt(
      active.value,
      dialog.value === 'logs'
        ? 'repair'
        : dialog.value === 'local'
          ? 'local'
          : 'build',
      version.value,
      build.value.phase === 'failed'
        ? build.value.log
        : 'Runtime startup failed. GPU allocation unavailable.',
      workspaceName.value
    )
  )
  const timers = new Set<ReturnType<typeof setTimeout>>()
  let idleTimer: ReturnType<typeof setTimeout> | undefined
  let wakeId = 0
  let buildId = 0
  function schedule(fn: () => void, ms: number) {
    const timer = setTimeout(() => {
      timers.delete(timer)
      fn()
    }, ms)
    timers.add(timer)
    return timer
  }
  onScopeDispose(() => {
    timers.forEach(clearTimeout)
    clearTimeout(idleTimer)
  })
  function flash(message: string) {
    notice.value = message
    schedule(() => {
      if (notice.value === message) notice.value = ''
    }, 5000)
  }
  function setVersion(next: Version) {
    version.value = next
    dialog.value = null
    pendingEnvironmentId.value = null
    if (next !== 3 && view.value === 'projects') view.value = 'home'
    const url = new URL(window.location.href)
    url.searchParams.set('v', String(next))
    window.history.replaceState({}, '', url)
  }
  function resetIdle() {
    clearTimeout(idleTimer)
    if (
      entry.value === 'cloud' &&
      runtime.value === 'ready' &&
      canSleep(jobs.value)
    )
      idleTimer = setTimeout(sleep, idleMinutes.value * 60_000)
  }
  function sleep() {
    if (!canSleep(jobs.value)) return false
    wakeId++
    runtime.value = 'sleeping'
    warmEnvironments.delete(environment.value.id)
    clearTimeout(idleTimer)
    return true
  }
  function wake(after?: () => void) {
    if (!allowed.value) return
    const id = ++wakeId
    runtime.value = 'starting'
    schedule(() => {
      if (id !== wakeId || !allowed.value) return
      runtime.value = 'ready'
      resetIdle()
      after?.()
    }, 1800)
  }
  function openWorkflow(id: string, target: 'cloud' | 'desktop' = 'cloud') {
    activeId.value = id
    openRequest.value++
    entry.value = target
    view.value = 'canvas'
    oom.value = false
    if (target === 'desktop') {
      wakeId++
      runtime.value = 'ready'
    } else wake()
  }
  function run(): boolean {
    if (
      !allowed.value ||
      (entry.value === 'cloud' && compatible.value.status !== 'compatible') ||
      runtime.value === 'starting' ||
      activeJob.value
    )
      return false
    if (entry.value === 'desktop') {
      oom.value = true
      dialog.value = 'outOfMemory'
      return false
    }
    if (runtime.value === 'sleeping' || runtime.value === 'failed') {
      wake(run)
      return false
    }
    const cold = !warmEnvironments.has(environment.value.id)
    const job: Job = {
      id: Math.max(Date.now(), (jobs.value.at(-1)?.id ?? 0) + 1),
      workflow: active.value.name,
      environmentId: environment.value.id,
      revision: environment.value.revision,
      startedAt: Date.now(),
      status: cold ? 'cold-start' : 'running',
      image: active.value.image
    }
    jobs.value.push(job)
    clearTimeout(idleTimer)
    function execute() {
      const current = jobs.value.find((j) => j.id === job.id)
      if (!current || current.status === 'cancelled') return
      warmEnvironments.add(current.environmentId)
      current.status = 'running'
      schedule(() => {
        if (current.status !== 'running') return
        current.status = 'completed'
        persist()
        resetIdle()
      }, 3200)
    }
    if (cold) schedule(execute, 5000)
    else execute()
    return true
  }
  function cancelJob() {
    if (!activeJob.value) return
    activeJob.value.status = 'cancelled'
    resetIdle()
  }
  const savedSchema = z.object({
    workflows: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        image: z.string(),
        packs: z.array(z.string()),
        models: z.array(z.string()),
        environmentId: z.string(),
        prompt: z.string(),
        steps: z.number(),
        seed: z.number(),
        saved: z.boolean(),
        positions: z.array(z.object({ x: z.number(), y: z.number() }))
      })
    ),
    environments: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        revision: z.string(),
        gpu: z.string(),
        packs: z.array(z.string()),
        models: z.array(z.string()),
        verified: z.boolean()
      })
    ),
    projectEnvironmentId: z.string(),
    jobs: z.array(
      z.object({
        id: z.number(),
        workflow: z.string(),
        environmentId: z.string(),
        revision: z.string(),
        status: z.literal('completed'),
        image: z.string()
      })
    )
  })
  const saved = new Map<string, Workflow>()
  function persist() {
    try {
      localStorage.setItem(
        'homestead-saved-v1',
        JSON.stringify({
          workflows: [...saved.values()],
          environments: availableEnvironments.value,
          projectEnvironmentId: projectEnvironmentId.value,
          jobs: jobs.value.filter((j) => j.status === 'completed')
        })
      )
      return true
    } catch {
      return false
    }
  }
  function save() {
    active.value.saved = true
    saved.set(active.value.id, structuredClone(toRaw(active.value)))
    return persist()
  }
  function restore() {
    try {
      const parsed = savedSchema.safeParse(
        JSON.parse(localStorage.getItem('homestead-saved-v1') ?? 'null')
      )
      if (parsed.success && parsed.data.workflows.length) {
        workflows.value = parsed.data.workflows
        availableEnvironments.value = parsed.data.environments
        projectEnvironmentId.value = parsed.data.projectEnvironmentId
        jobs.value = parsed.data.jobs
      }
    } catch {
      /* Invalid browser storage falls back to the demo fixtures. */
    }
    workflows.value.forEach((w) => saved.set(w.id, structuredClone(toRaw(w))))
    const query = new URLSearchParams(window.location.search).get('v')
    if (query === '2' || query === '3')
      version.value = Number(query) === 2 ? 2 : 3
  }
  function switchEnvironment(id: string, confirmed = false) {
    const candidate = availableEnvironments.value.find((e) => e.id === id)
    if (!candidate || !allowed.value) return
    if (version.value === 3) {
      if (!confirmed) {
        pendingEnvironmentId.value = id
        return
      }
      projectEnvironmentId.value = id
      if (projectId.value) projectEnvironments.value[projectId.value] = id
    } else {
      if (compatibility(active.value, candidate).status !== 'compatible') return
      active.value.environmentId = id
      const previous = saved.get(active.value.id)
      if (previous) saved.set(previous.id, { ...previous, environmentId: id })
    }
    pendingEnvironmentId.value = null
    dialog.value = null
    entry.value = 'cloud'
    persist()
    if (view.value === 'canvas') wake()
  }
  function importWorkflow() {
    if (enabled.value) {
      activeId.value =
        importCase.value === 'compatible' ? workflows.value[0].id : 'matte'
      const matte = workflows.value.find((w) => w.id === 'matte')
      if (matte)
        matte.packs = [
          'comfyui-rmbg',
          'acme-matte-tools',
          ...(importCase.value === 'missing' ? ['studio-matte-v2'] : [])
        ]
      entry.value = 'cloud'
      dialog.value = 'import'
      return
    }
    activeId.value = importCase.value === 'compatible' ? 'product' : 'matte'
    if (importCase.value === 'missing') {
      const existing = workflows.value.find((w) => w.id === 'imported')
      if (!existing)
        workflows.value.push({
          ...seedWorkflows()[1],
          id: 'imported',
          name: 'Matte pass · imported',
          packs: ['ComfyUI Core', 'Impact Pack 8.8', 'Studio Matte Tools 0.3'],
          saved: false
        })
      activeId.value = 'imported'
    }
    entry.value = 'cloud'
    dialog.value = 'import'
  }
  function editBuildFor(id: string) {
    editingEnvironmentId.value = id
    dialog.value = 'platform'
  }
  function startBuild(
    surface: 'agent' | 'platform' | 'manager',
    request?: DesktopBuildRequest,
    retryWorkflow?: Workflow
  ) {
    if (!editableBuild.value || build.value.phase === 'building') return
    const requestedSource =
      request?.mode === 'update'
        ? availableEnvironments.value.find(
            (e) => e.id === request.sourceId && e.verified
          )
        : undefined
    if (
      request &&
      (!request.name.trim() ||
        !request.gpu.trim() ||
        (request.mode === 'update' && !requestedSource))
    )
      return
    const workflow = structuredClone(toRaw(retryWorkflow ?? active.value))
    const source = structuredClone(
      toRaw(
        requestedSource ??
          (surface === 'platform' ? buildEnvironment.value : environment.value)
      )
    )
    const sourcePacks = request?.mode === 'create' ? [] : source.packs
    const sourceModels = request?.mode === 'create' ? [] : source.models
    const capturedRequest = request
      ? structuredClone(toRaw(request))
      : undefined
    agentRun.value =
      capturedRequest && surface === 'agent'
        ? {
            request: capturedRequest,
            workflow,
            workspace: workspaceName.value,
            prompt: desktopBuildPrompt(
              capturedRequest,
              workflow,
              workspaceName.value
            ),
            sourceRevision: requestedSource?.revision
          }
        : null
    agentStep.value = 0
    buildSurface.value = surface
    buildWorkflowId.value = workflow.id
    buildProjectId.value = projectId.value
    if (surface === 'manager' && capturedRequest) {
      cloudBuild.value = {
        request: capturedRequest,
        workflow,
        packs: [...selectedPacks.value],
        projectId: projectId.value
      }
    } else if (surface !== 'agent') cloudBuild.value = null
    buildRequiredPacks.value = [
      ...new Set([...sourcePacks, ...workflow.packs, ...selectedPacks.value])
    ]
    const models = [...new Set([...sourceModels, ...workflow.models])]
    build.value = transitionBuild(build.value, 'start')
    if (surface === 'agent') {
      dialog.value = null
      agentOpen.value = true
    }
    const id = ++buildId
    const outcome = failure.value
    const familyId =
      request?.mode === 'create'
        ? undefined
        : (requestedSource?.buildId ??
          requestedSource?.id ??
          source.buildId ??
          source.id)
    const revisions = availableEnvironments.value
      .filter((e) => !request || (e.buildId ?? e.id) === familyId)
      .map((e) => Number(e.revision.slice(1)))
    const nextRevision =
      request?.mode === 'create' ? 1 : Math.max(0, ...revisions) + 1
    const environmentId = request
      ? `build-${crypto.randomUUID()}`
      : `build-${nextRevision}`
    function finish() {
      const env: Environment = {
        id: environmentId,
        buildId: familyId ?? environmentId,
        name: capturedRequest?.name.trim() ?? source.name,
        revision: `v${nextRevision}`,
        gpu: capturedRequest?.gpu ?? source.gpu,
        packs: [...buildRequiredPacks.value],
        models,
        verified: true
      }
      availableEnvironments.value = [...availableEnvironments.value, env]
      build.value = { phase: 'ready', environmentId: env.id }
      if (capturedRequest) {
        try {
          localStorage.setItem(
            `homestead-open-ui:${env.id}`,
            JSON.stringify({ environment: env, workflow })
          )
        } catch {
          /* The same-session Open UI action remains available without browser storage. */
        }
      }
    }
    function advanceAgent() {
      if (id !== buildId || build.value.phase !== 'building') return
      agentStep.value++
      if (outcome === 'build' && agentStep.value === 6) {
        build.value = {
          phase: 'failed',
          stage: 'build',
          log: `${capturedRequest?.name}: dependency installation failed.\nCould not resolve a required package from the workflow manifest.\nThe working build ${source.name} ${source.revision} remains available.`
        }
        return
      }
      if (outcome === 'deployment' && agentStep.value === 8) {
        build.value = {
          phase: 'failed',
          stage: 'deployment',
          log: `${capturedRequest?.name}: readiness probe timed out.\nThe worker did not report all required nodes.\nThe working build ${source.name} ${source.revision} remains available.`
        }
        return
      }
      if (agentStep.value >= 9) {
        finish()
        return
      }
      build.value = {
        phase: 'building',
        step: Math.min(3, Math.floor(agentStep.value / 2))
      }
      schedule(advanceAgent, 2000)
    }
    function advance() {
      if (id !== buildId || build.value.phase !== 'building') return
      const fail =
        (outcome === 'build' && build.value.step === 1) ||
        (outcome === 'deployment' && build.value.step === 3)
      build.value = transitionBuild(
        build.value,
        fail
          ? outcome === 'build'
            ? 'fail-build'
            : 'fail-deployment'
          : 'advance'
      )
      if (build.value.phase === 'failed' && capturedRequest) {
        build.value = {
          ...build.value,
          log:
            build.value.stage === 'build'
              ? `${capturedRequest.name}: dependency installation failed.\nCould not resolve a required package in the selected node sources.\nNode packs: ${buildRequiredPacks.value.join(', ')}.\nThe working build ${source.name} ${source.revision} remains available.`
              : `${capturedRequest.name}: deployment health check failed.\nThe worker did not load all required nodes before the readiness timeout.\nThe working build ${source.name} ${source.revision} remains available.`
        }
      }
      if (build.value.phase === 'building') schedule(advance, 1000)
      if (build.value.phase === 'ready') finish()
    }
    schedule(
      agentRun.value ? advanceAgent : advance,
      agentRun.value ? 2000 : 1000
    )
  }
  function repairCloudBuild() {
    if (!cloudBuild.value || build.value.phase !== 'failed') return
    const previous = cloudBuild.value
    const instructions = `Repair this failed Cloud build. Preserve its selected registry and private node packs: ${previous.packs.join(', ')}.\n${build.value.log}\nInspect the package sources locally and resolve the error before rebuilding.`
    selectedPacks.value = [...previous.packs]
    failure.value = 'none'
    startBuild(
      'agent',
      { ...previous.request, instructions },
      previous.workflow
    )
    buildProjectId.value = previous.projectId
  }
  function retryBuild() {
    failure.value = 'none'
    startBuild(
      buildSurface.value,
      agentRun.value?.request,
      agentRun.value?.workflow
    )
  }
  function restoreDeploymentLink() {
    const params = new URLSearchParams(window.location.search)
    const deploymentId = params.get('deployment')
    if (!deploymentId) return
    try {
      const parsed = deploymentLinkSchema.safeParse(
        JSON.parse(
          localStorage.getItem(`homestead-open-ui:${deploymentId}`) ?? 'null'
        )
      )
      if (!parsed.success || parsed.data.environment.id !== deploymentId) return
      const { environment: env, workflow } = parsed.data
      if (!availableEnvironments.value.some((e) => e.id === env.id))
        availableEnvironments.value.push(env)
      if (!workflows.value.some((w) => w.id === workflow.id))
        workflows.value.push(workflow)
      activeId.value = workflow.id
      if (version.value === 3) {
        dialog.value = 'environment'
        pendingEnvironmentId.value = env.id
      } else {
        switchEnvironment(env.id)
        openWorkflow(workflow.id)
      }
    } catch {
      /* Invalid or unavailable local links leave the dashboard intact. */
    }
  }
  function openBuilt() {
    if (build.value.phase !== 'ready') return
    activeId.value = buildWorkflowId.value
    if (version.value === 3) {
      projectId.value = buildProjectId.value
      projectEnvironmentId.value =
        projectEnvironments.value[projectId.value ?? ''] ??
        projectEnvironmentId.value
      dialog.value = 'environment'
      pendingEnvironmentId.value = build.value.environmentId
      return
    }
    switchEnvironment(build.value.environmentId)
    agentOpen.value = false
    openWorkflow(activeId.value)
  }
  function reset() {
    buildId++
    wakeId++
    timers.forEach(clearTimeout)
    timers.clear()
    clearTimeout(idleTimer)
    workflows.value = seedWorkflows()
    availableEnvironments.value = structuredClone(environments)
    jobs.value = []
    warmEnvironments.clear()
    build.value = { phase: 'idle' }
    cloudBuild.value = null
    projectEnvironmentId.value = 'studio'
    view.value = 'home'
    dialog.value = null
    agentOpen.value = false
    agentRun.value = null
    agentStep.value = 0
    entry.value = 'cloud'
    runtime.value = 'sleeping'
    access.value = 'admin'
    failure.value = 'none'
    editingEnvironmentId.value = null
    idleMinutes.value = 3
    importCase.value = 'compatible'
    selectedPacks.value = []
    oom.value = false
    activeId.value = 'product'
    notice.value = ''
    pendingEnvironmentId.value = null
    saved.clear()
    workflows.value.forEach((w) => saved.set(w.id, structuredClone(toRaw(w))))
    persist()
  }
  restore()
  return {
    enabled,
    workspaceName,
    projectId,
    projectEnvironments,
    projectWorkflows,
    openRequest,
    version,
    view,
    entry,
    access,
    workflows,
    activeId,
    projectEnvironmentId,
    availableEnvironments,
    runtime,
    build,
    buildSurface,
    failure,
    dialog,
    agentOpen,
    agentRun,
    cloudBuild,
    repairCloudBuild,
    agentStep,
    agentUrl,
    retryBuild,
    restoreDeploymentLink,
    configOpen,
    importCase,
    selectedPacks,
    jobs,
    activeJob,
    cancelJob,
    notice,
    idleMinutes,
    oom,
    pendingEnvironmentId,
    active,
    environment,
    buildEnvironment,
    updateEnvironment,
    editBuildFor,
    allowed,
    editableBuild,
    compatible,
    prompt,
    flash,
    setVersion,
    resetIdle,
    sleep,
    wake,
    openWorkflow,
    run,
    save,
    switchEnvironment,
    importWorkflow,
    startBuild,
    openBuilt,
    reset
  }
})
