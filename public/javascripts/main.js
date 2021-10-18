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

  const socketMessage = document.querySelector("#socket-message");

  const errorsConsole = document.querySelector("#errors");

  socketMessage.style.transition = "opacity 0.5s ease";
  previewImage.style.transition  = "opacity 0.5s ease";

  const socket = io();

  function enableButtons() {
    uploadSpinner.style.display = "none";
    uploadBtn.removeAttribute("disabled");
    sourceBtn.removeAttribute("disabled");
    outputBtn.removeAttribute("disabled");

    setTimeout(() => {
      socketMessage.style.opacity = 0;
      socketMessage.innerText = "";
    }, 6000);
  }

  function disableButtons() {
    uploadSpinner.style.display = "inline-block";
    uploadBtn.setAttribute("disabled", true);
    sourceBtn.setAttribute("disabled", true);
    outputBtn.setAttribute("disabled", true);

    socketMessage.style.opacity = 1;
  }

  uploadSpinner.style.display = "none";

  socket.on("connect", () => {
    UIkit.notification({
      message: "Reconnected",
      status: "success",
      pos: "bottom-center",
      timeout: 5000,
    });
  });

  socket.on("disconnect", () => {
    enableButtons();
  });

  socket.on("message", message => {
    socketMessage.innerText = message;
  });

  socket.on("progress", (data) => {
    if (data.progress == 100) {
      uploadSpinner.style.display = "none";
      uploadBtn.removeAttribute("disabled");
    }

    if(data.error) {
      const errorHtml = document.createElement('p');
      errorHtml.innerText = `${data.sku}: ${data.message}`;
      errorsConsole.appendChild(errorHtml);
    } 

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
      pos: "top-center",
      timeout: 5000,
    });
  });

  socket.on("update_image", sku => {
    previewImage.style.top = "0px";
    previewImage.src = `${sku}.jpeg`;
  });

  socket.on("task_finished", (data) => {
    let message = "<span uk-icon='icon: check'></span> " + data.message;
    let status = "success";

    if (data.errors) {
      message = "<span uk-icon='icon: close'></span> " + data.message;
      status = "danger";
    }

    UIkit.notification({
      message: message,
      status: status,
      pos: "top-center",
      timeout: 5000,
    });

    enableButtons();
    progressBar.setAttribute("value", data.progress);
  });

  uploadBtn.addEventListener("click", (event) => {
    progressBar.setAttribute("value", 0);

    errorsConsole.innerHTML = "<p><strong>Errors Console</strong></p>";
    disableButtons();
    event.preventDefault();

    const formdata = new FormData(uploadForm);

    fetch("/upload", { method: "POST", body: formdata })
      .then(async (data) => {
        const response = await data.json();
        if (data.status != 200) {
          enableButtons();
        }
      })
      .catch((err) => {
        console.log(err);
        enableButtons();
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

  document
    .querySelector("#open-source-folder-btn")
    .addEventListener("click", (event) => {
      fetch("/config/source", {
        method: "POST",
      }).then(() => {});
    });

  document
    .querySelector("#open-output-folder-btn")
    .addEventListener("click", (event) => {
      fetch("/config/output", {
        method: "POST",
      }).then(() => {});
    });
};
