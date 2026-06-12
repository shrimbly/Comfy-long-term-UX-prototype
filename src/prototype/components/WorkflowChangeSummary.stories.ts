import type { Meta, StoryObj } from '@storybook/vue3-vite'

import Button from '@/components/ui/button/Button.vue'

import WorkflowChangeSummary from './WorkflowChangeSummary.vue'
import type { SemanticDiff } from '../utils/workflowDiff'

// The actual semanticWorkflowDiff() output for the real "Contact Sheet
// Home Grown" v1→v2 pair, with the prompt before/after snippet a P2 util
// would attach. Subgraph-instance node types resolved to their names.
const contactSheetDiff: SemanticDiff = {
  headline: ['Prompt edited', 'Seed changed', '6 nodes moved'],
  counts: {
    added: 0,
    removed: 0,
    rewired: 0,
    prompts: 1,
    params: 0,
    seeds: 1,
    moved: 6,
    bypassed: 0,
    renamed: 0,
    groups: 0
  },
  details: [
    {
      channel: 'widget',
      scope: 'subgraph "Text to Image (Ideogram v4)"',
      nodeType: 'CLIPTextEncode',
      nodeId: '24',
      widgetKind: 'prompt',
      label: '+1 / −4 words',
      before:
        '…the other hand holding a lit cigarette near her hip. Expression:…',
      after: '…the other hand holding a lit cigarette. Expression:…'
    },
    {
      channel: 'widget',
      scope: 'subgraph "Text to Image (Ideogram v4)"',
      nodeType: 'RandomNoise',
      nodeId: '18',
      widgetKind: 'seed',
      label: 'Seed changed'
    },
    {
      channel: 'layout',
      scope: 'root',
      nodeType: 'ResolutionSelector',
      label: 'moved'
    },
    {
      channel: 'layout',
      scope: 'root',
      nodeType: 'Text to Image (Ideogram v4)',
      label: 'moved'
    },
    { channel: 'layout', scope: 'root', nodeType: 'SaveImage', label: 'moved' },
    {
      channel: 'layout',
      scope: 'root',
      nodeType: 'FL_ImageSlicer',
      label: 'moved'
    },
    {
      channel: 'layout',
      scope: 'root',
      nodeType: 'Image Upscale (SeedVR2)',
      label: 'moved'
    },
    { channel: 'layout', scope: 'root', nodeType: 'SaveImage', label: 'moved' }
  ]
}

// A heavier edit — exercises every channel + the 3-item truncation.
const structuralDiff: SemanticDiff = {
  headline: [
    '3 nodes added',
    '1 node removed',
    '3 connections changed',
    'Prompt edited'
  ],
  counts: {
    added: 3,
    removed: 1,
    rewired: 3,
    prompts: 1,
    params: 2,
    seeds: 0,
    moved: 4,
    bypassed: 1,
    renamed: 0,
    groups: 0
  },
  details: [
    {
      channel: 'widget',
      scope: 'root',
      nodeType: 'CLIPTextEncode',
      widgetKind: 'prompt',
      label: '+6 / −2 words',
      before: 'a cinematic wide establishing shot, golden hour',
      after:
        'a cinematic wide establishing shot at dusk, volumetric fog, golden hour'
    },
    {
      channel: 'widget',
      scope: 'root',
      nodeType: 'KSampler',
      widgetKind: 'param',
      label: 'steps 20 → 25'
    },
    {
      channel: 'widget',
      scope: 'root',
      nodeType: 'KSampler',
      widgetKind: 'param',
      label: 'cfg 8 → 6.5'
    },
    {
      channel: 'added',
      scope: 'root',
      nodeType: 'LoraLoader',
      label: 'LoraLoader'
    },
    {
      channel: 'added',
      scope: 'root',
      nodeType: 'ControlNetApplyAdvanced',
      label: 'ControlNetApplyAdvanced'
    },
    {
      channel: 'added',
      scope: 'root',
      nodeType: 'Upscale (SeedVR2)',
      isSubgraph: true,
      label: 'Upscale (SeedVR2)'
    },
    {
      channel: 'removed',
      scope: 'root',
      nodeType: 'UpscaleModelLoader',
      label: 'UpscaleModelLoader'
    },
    { channel: 'rewired', scope: 'root', label: '+ 12:0→18:1' },
    { channel: 'rewired', scope: 'root', label: '+ 18:0→20:0' },
    { channel: 'rewired', scope: 'root', label: '− 12:0→20:0' },
    {
      channel: 'mode',
      scope: 'root',
      nodeType: 'VAEDecodeTiled',
      label: 'bypassed'
    },
    { channel: 'layout', scope: 'root', nodeType: 'KSampler', label: 'moved' },
    { channel: 'layout', scope: 'root', nodeType: 'VAEDecode', label: 'moved' },
    { channel: 'layout', scope: 'root', nodeType: 'SaveImage', label: 'moved' },
    { channel: 'layout', scope: 'root', nodeType: 'LoadImage', label: 'moved' }
  ]
}

const minimalDiff: SemanticDiff = {
  headline: ['steps 20 → 25'],
  counts: {
    added: 0,
    removed: 0,
    rewired: 0,
    prompts: 0,
    params: 1,
    seeds: 0,
    moved: 0,
    bypassed: 0,
    renamed: 0,
    groups: 0
  },
  details: [
    {
      channel: 'widget',
      scope: 'root',
      nodeType: 'KSampler',
      widgetKind: 'param',
      label: 'steps 20 → 25'
    }
  ]
}

const meta: Meta<typeof WorkflowChangeSummary> = {
  title: 'Prototype/WorkflowChangeSummary',
  component: WorkflowChangeSummary,
  parameters: { layout: 'centered' },
  decorators: [
    () => ({
      template: `
        <div class="w-[40rem] bg-base-background p-8 text-base-foreground">
          <story />
        </div>
      `
    })
  ],
  args: { diff: contactSheetDiff }
}

export default meta
type Story = StoryObj<typeof meta>

// Resting state — categorised count rows, each with its own chevron.
export const Default: Story = {}

// Heavier edit: nodes + subgraphs added/removed/skipped/moved, widgets,
// and an "Other changes" catch-all.
export const Structural: Story = { args: { diff: structuralDiff } }

// A single widget edit — one expandable row.
export const SingleParameter: Story = { args: { diff: minimalDiff } }

// The ideal review-row state: identity + chips + note + actions.
const reviewCardTemplate = `
  <div class="flex w-[40rem] flex-col gap-3 rounded-xl border border-border-subtle bg-secondary-background p-4">
    <div class="flex items-start justify-between gap-2">
      <div class="flex flex-col gap-0.5">
        <span class="text-sm font-medium text-base-foreground">Establishing shot generator</span>
        <span class="text-xs text-muted-foreground">Mira Voss · 2 days ago · Indie Short Film</span>
      </div>
      <span class="shrink-0 rounded-sm bg-base-background px-1.5 py-0.5 text-[10px] text-muted-foreground">Pending review</span>
    </div>

    <WorkflowChangeSummary :diff="diff" />

    <p class="m-0 text-xs text-base-foreground italic">“Tweaked the sky gradient + added a depth pass.”</p>

    <div class="flex items-center justify-between gap-2 border-t border-border-subtle pt-3">
      <Button variant="textonly" size="md" class="gap-1.5">
        <i class="icon-[lucide--square-arrow-out-up-right] size-4" />
        Open workflow
      </Button>
      <div class="flex gap-2">
        <Button variant="secondary" size="md">Decline</Button>
        <Button variant="primary" size="md" class="gap-1.5">
          <i class="icon-[lucide--check] size-4" />
          Approve
        </Button>
      </div>
    </div>
  </div>
`

export const InReviewCard: Story = {
  render: (args) => ({
    components: { WorkflowChangeSummary, Button },
    setup: () => ({ diff: args.diff }),
    template: reviewCardTemplate
  })
}

export const InReviewCardStructural: Story = {
  args: { diff: structuralDiff },
  render: (args) => ({
    components: { WorkflowChangeSummary, Button },
    setup: () => ({ diff: args.diff }),
    template: reviewCardTemplate
  })
}
