import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:city?/:routeName?',
      name: 'home',
      component: HomeView,
      props: true,
    },
  ],
})

export default router
