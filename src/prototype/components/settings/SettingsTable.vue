<!--
  Standardized table chrome for Workspace Settings. Caller writes
  <thead>/<tbody> via the default slot.

  Cell class patterns used inside (kept inline, not as a stylesheet):
    <thead class="bg-secondary-background">
      <tr>
        <th class="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted">…</th>
      </tr>
    </thead>
    <tbody>
      <tr class="border-t border-interface-stroke">
        <td class="px-3 py-2 align-middle text-sm">…</td>
      </tr>
    </tbody>
-->
<template>
  <div class="overflow-hidden rounded-lg border border-interface-stroke">
    <table class="w-full border-collapse text-sm">
      <slot />
    </table>
  </div>
</template>
