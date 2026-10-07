// Implements:
//   prototype scaffolding — routes mounted by src/router.ts under /prototype.

import type { RouteRecordRaw } from 'vue-router'

const PrototypeLayout = () => import('./layouts/PrototypeLayout.vue')
const Dashboard = () => import('./pages/Dashboard.vue')
const EditDeploymentOptions = () => import('./pages/EditDeploymentOptions.vue')

export const prototypeRoutes: RouteRecordRaw[] = [
  {
    path: '/prototype',
    component: PrototypeLayout,
    children: [
      { path: '', redirect: { name: 'PrototypeDashboard' } },
      {
        path: 'dashboard',
        name: 'PrototypeDashboard',
        component: Dashboard
      },
      {
        path: 'design/edit-deployment',
        name: 'PrototypeEditDeploymentOptions',
        component: EditDeploymentOptions
      }
    ]
  }
]
