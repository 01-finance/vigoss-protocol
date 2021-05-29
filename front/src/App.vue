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
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
input {
    outline-style: none ;
    border: 1px solid #ccc; 
    border-radius: 3px;
    margin: 2px;
    padding: 7px 5px;
    width: 360px;
    font-size: 18px;
}
span {
  font-size: 18px;  
}
button {
  font-size: 18px;
}

</style>
