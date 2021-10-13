window.onload = () => {
  const uploadBtn = document.querySelector("#upload-btn");
  const uploadForm = document.querySelector("#upload-excel-form");
  const progressBar = document.querySelector("#progress-bar");
  const uploadSpinner = document.querySelector("#upload-spinner");

  const outputBtn = document.querySelector("#output-folder-submit-btn");
  const outputForm = document.querySelector("#set-output-folder-form");

  const sourceBtn = document.querySelector("#source-folder-submit-btn");
  const sourceForm = document.querySelector("#set-source-folder-form");

  const previewImage = document.querySelector("#preview-image");

  const socket = io();

  uploadSpinner.style.display = "none";

  socket.on("connect", () => {
    console.log("socket connected");
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected");
  });

  socket.on("progress", (data) => {
    if (data.progress == 100) {
      uploadSpinner.style.display = "none";
      uploadBtn.removeAttribute("disabled");
    }

    previewImage.setAttribute("src", data.sku + ".jpeg");

    progressBar.setAttribute("value", data.progress);
  });

  socket.on("notification", (data) => {
    let message = "<span uk-icon='icon: check'></span> " + data.message;
    let status = "success";

    if (data.errors) {
      message = "<span uk-icon='icon: close'></span> " + data.message;
      status = "danger";
    }

    UIkit.notification({
      message: message,
      status: status,
      pos: "top-right",
      timeout: 5000,
    });
  });

  socket.on("task_finished", (data) => {
    let message = "<span uk-icon='icon: check'></span> " + data.message;
    let status = "success";

    if (data.errors) {
      message = "<span uk-icon='icon: close'></span> " + data.message;
      status = "danger";
    } else {
      previewImage.setAttribute("src", data.sku + ".jpeg");
    }

    UIkit.notification({
      message: message,
      status: status,
      pos: "top-right",
      timeout: 5000,
    });

    uploadSpinner.style.display = "none";
    uploadBtn.removeAttribute("disabled");
    progressBar.setAttribute("value", data.progress);
  });

  uploadBtn.addEventListener("click", (event) => {
    progressBar.setAttribute("value", 0);
    uploadBtn.setAttribute("disabled", "true");
    uploadSpinner.style.display = "inline-block";
    event.preventDefault();

    const formdata = new FormData(uploadForm);

    fetch("/upload", { method: "POST", body: formdata })
      .then(async (data) => {
        const response = await data.json();
        console.log(response);
        if (data.status != 200) {
          uploadSpinner.style.display = "none";
          uploadBtn.removeAttribute("disabled");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });

  outputBtn.addEventListener("click", (event) => {
    event.preventDefault();

    const formdata = new FormData(outputForm);

    const object = {};
    formdata.forEach((value, key) => (object[key] = value));
    const json = JSON.stringify(object);

    fetch("/config", {
      method: "POST",
      body: json,
      headers: { "Content-Type": "application/json" },
    })
      .then(async (data) => {
        const response = await data.json();

        if (data.status == 400) {
          document.querySelector("#output-folder").value = response.output;
        }

        UIkit.notification({
          message: response.message || "Request OK",
          status: response.error ? "danger" : "success",
          pos: "top-center",
          timeout: 5000,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });

  sourceBtn.addEventListener("click", (event) => {
    event.preventDefault();

    const formdata = new FormData(sourceForm);
    const object = {};
    formdata.forEach((value, key) => (object[key] = value));
    const json = JSON.stringify(object);

    fetch("/config", {
      method: "POST",
      body: json,
      headers: { "Content-Type": "application/json" },
    })
      .then(async (data) => {
        const response = await data.json();

        if (data.status == 400) {
          document.querySelector("#source-folder").value = response.source;
        }

        UIkit.notification({
          message: response.message || "Request OK",
          status: response.error ? "danger" : "success",
          pos: "top-center",
          timeout: 5000,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};
