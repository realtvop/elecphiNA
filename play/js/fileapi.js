document.addEventListener("dragstart", event => event.preventDefault());
document.addEventListener("dragover", event => {
    let draggedFiles = event.dataTransfer.items;
    console.log(draggedFiles[0].type);
    let droppedZip;
    // if (droppedFiles[0].type === "")
});
document.addEventListener("dragleave", event => {
    console.log("dragleave");
});
document.addEventListener("drop", event => {
    let droppedFiles = event.dataTransfer.files;
    console.log(droppedFiles);
    let droppedZip;
    if (droppedFiles[0].type === "application/zip") {
        droppedZip = droppedFiles[0];
    }
});