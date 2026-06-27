<template>
    <div class="css-proxy" style="display: none;"></div>
</template>

<script setup>
import { bus } from "@xxmm-apps/electron/eventBus";
import backgroundImage from "../assets/background.png";

let currentTheme = "";
const changeTheme = async (theme) => {
  if (currentTheme === theme) return;
  currentTheme = theme;

  const appContainer = document.querySelector("#app-container");
  if (!appContainer) return;

  appContainer.setAttribute("theme", theme);

  if (theme === "dark") {
    appContainer.style.backgroundImage = `url(${backgroundImage})`;
  } else {
    appContainer.style.backgroundImage = "none";
  }
};

bus.on("themeChange", changeTheme);
</script>