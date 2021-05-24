<template>
  <div id="app">
    <Vigoss/>
  </div>
</template>

<script>
import Vigoss from './components/Vigoss.vue'

export default {
  name: 'App',
  components: {
    Vigoss
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
