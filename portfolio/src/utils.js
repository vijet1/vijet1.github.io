export function setTabHeader(iconLink, title){
  if (iconLink){
    const favicon = document.querySelector("link[rel='icon']");
    favicon.href = iconLink;
  }
  if (title){
    document.title = title;
  }
}