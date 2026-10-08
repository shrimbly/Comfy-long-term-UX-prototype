import { useHomesteadStore } from '../homestead/store'
import { nativeDeployment } from '../homestead/nativeModel'
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { COMFY_CLOUD } from '../fixtures/customCloud'
import type { Deployment } from '../types'
import { usePrototypePersonaStore } from './personaStore'

export const usePrototypeEnvironmentStore = defineStore(
  'prototype-environments',
  () => {
    const personas = usePrototypePersonaStore()
    const homestead = useHomesteadStore()
    const gpus = ['RTX 4090', 'RTX 5090']
    const canManage = computed(
      () => personas.currentWorkspace?.currentUserRole === 'admin'
    )
    const deployments = computed(() =>
      homestead.enabled
        ? homestead.availableEnvironments
            .filter((e) => e.id !== COMFY_CLOUD.id)
            .map(nativeDeployment)
        : (personas.fixture.deployments ?? []).filter((deployment) => {
            const workspaceId =
              deployment.workspaceId ??
              personas.fixture.projects.find(
                (project) => project.deploymentId === deployment.id
              )?.workspaceId
            return (
              deployment.kind === 'custom' &&
              workspaceId === personas.fixture.currentWorkspaceId
            )
          })
    )
    const projects = computed(() => [
      ...(personas.draftsProject ? [personas.draftsProject] : []),
      ...personas.visibleProjects
    ])
    const builds = computed(() => [
      COMFY_CLOUD,
      ...deployments.value.filter(
        (deployment) => deployment.status !== 'building'
      )
    ])

    function create(name: string, gpu: string, buildId: string): boolean {
      const source = builds.value.find((build) => build.id === buildId)
      if (!canManage.value || !name.trim() || !source || !gpus.includes(gpu))
        return false
      const deployment: Deployment = {
        id: `dep-${crypto.randomUUID()}`,
        workspaceId: personas.fixture.currentWorkspaceId,
        name: name.trim(),
        kind: 'custom',
        release: source.release ?? 'v1',
        status: 'asleep',
        gpu,
        warmMinutes: 2,
        nodePacks: [...source.nodePacks],
        models: [...source.models]
      }
      personas.fixture.deployments = [
        ...(personas.fixture.deployments ?? []),
        deployment
      ]
      return true
    }

    function update(id: string, name: string, warmMinutes: number): boolean {
      const deployment = deployments.value.find((item) => item.id === id)
      if (
        !canManage.value ||
        !deployment ||
        deployment.status === 'building' ||
        !name.trim() ||
        !Number.isInteger(warmMinutes) ||
        warmMinutes < 0 ||
        warmMinutes > 60
      )
        return false
      personas.fixture.deployments = (personas.fixture.deployments ?? []).map(
        (item) =>
          item.id === id ? { ...item, name: name.trim(), warmMinutes } : item
      )
      return true
    }

    return { deployments, projects, builds, gpus, canManage, create, update }
  }
)
