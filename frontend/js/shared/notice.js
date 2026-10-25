let timer;

export function showNotice(message, type = "success") {
  const box = document.querySelector("#notice");
  box.textContent = message;
  box.dataset.type = type;
  box.classList.add("is-visible");
  clearTimeout(timer);
  if (type !== "error") {
    timer = setTimeout(() => box.classList.remove("is-visible"), 5000);
  }
}
