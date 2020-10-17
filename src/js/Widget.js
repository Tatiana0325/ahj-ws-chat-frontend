export default class Widget {
  constructor(url) {
    this.container = document.getElementById('widget');
    this.openUsers = [];
    this.curentUser = null;
    this.ws = new WebSocket(url);
    this.cashMessages = [];

    this.ws.addEventListener("open", () => {
      console.log("connected");
    });

    this.ws.addEventListener("message", (evt) => {
      const response = JSON.parse(evt.data);
      if (response.type === "error") {
        this.showError(document.querySelector("input"), response.text);
      } else if (response.type === "allUsers") {
        this.openUsers = response.data;
        this.hideForm();
        this.showChat();
      } else if (
        response.type === "disconnect" ||
        response.type === "connect"
      ) {
        console.log(response.data);
      } else if (response.type === "addMessage") {
        this.cashMessages.push(response.data.data);
        this.showMessage(response.data.data);
      }
    });

    this.ws.addEventListener("close", (evt) => {
      console.log("connection closed", evt);
    });

    this.ws.addEventListener("error", () => {
      console.log("error");
    });

    window.addEventListener("beforeunload", () => {
      this.ws.send(
        JSON.stringify({ type: "deleteUser", user: this.curentUser })
      );
    });
  }

  createNick() {
    const form = document.createElement("form");
    form.classList.add("form");
    const head = document.createElement("h4");
    head.classList.add("head");
    const box = document.createElement("div");
    box.classList.add("box");
    const input = document.createElement("input");
    const btn = document.createElement("button");
    btn.classList.add("btn");

    head.textContent = "Choose nickname";
    btn.textContent = "Next";
    input.name = "nick";

    box.appendChild(input);
    form.append(head, box, btn);
    this.container.appendChild(form);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const nick = event.target.nick.value.toLowerCase();
      const response = { type: "addUser", user: nick };
      this.curentUser = nick;
      this.ws.send(JSON.stringify(response));
    });

    input.addEventListener("input", () => {
      this.deleteError();
    });
  }

  hideForm() {
    this.container.removeChild(this.container.firstChild);
  }

  showChat() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <h2 class="welcome">Welcome to the chat</h2>
      <div class="wrapper">
        <div class="list-part">
        </div>
        <div class="chat">
            <div class="messages">
            ${this.showCashMessages().outerHTML}
            </div>
            <div class="message-text">
            <form class="form-message">
                <input type="text" name="message" id="message" class="input" 
                placeholder="Type your message here">
            </form>
            </div>
        </div>
      </div>
    `;
    this.container.appendChild(wrapper);
    /* eslint-disable */
    document
      .querySelector(".form-message")
      .addEventListener("submit", (event) => {
        event.preventDefault();
        const message = event.target.message.value.trim();
        const date = new Date().toLocaleString();
        this.ws.send(
          JSON.stringify({
            type: "addMessage",
            data: {
              user: this.curentUser,
              message,
              date,
            },
          })
        );
        event.target.message.value = "";
      });

    this.showPart();
  }

  showCashMessages() {
    const box = document.createElement("div");
    this.cashMessages.forEach((elem) => {
      const message = this.creatMessage(elem);
      box.appendChild(message);
    });
    return box;
  }

  showPart() {
    const list = document.querySelector(".list-part");
    this.openUsers.forEach((elem) => {
      const user = document.createElement("div");
      const avatar = document.createElement("div");
      const name = document.createElement("div");

      user.classList.add("user");
      avatar.classList.add("avatar");
      name.classList.add("name");

      name.textContent = elem.name;
      if (elem.name === this.curentUser) {
        name.textContent = "You";
        name.classList.add("you-name");
        avatar.classList.add("you-avatar");
      }

      user.append(avatar, name);
      list.appendChild(user);
    });
  }

  creatMessage(data) {
    const message = document.createElement("div");
    const name = document.createElement("div");
    const date = document.createElement("div");
    const text = document.createElement("div");

    message.classList.add("message");
    date.classList.add("date");
    text.classList.add("text");
    name.classList.add("small-name");

    date.textContent = data.date;
    name.textContent = data.user;
    text.textContent = data.message;

    if (data.user === this.curentUser) {
      message.classList.add("you-message");
      name.textContent = "You";
    }

    message.append(name, date, text);
    return message;
  }

  showMessage(data) {
    const box = document.querySelector(".messages");
    const message = this.creatMessage(data);
    box.appendChild(message);
  }

  showError(target, text) {
    target.focus();
    const error = document.createElement("div");
    error.dataset.id = "error";
    error.className = "form-error";
    error.textContent = `${text}`;

    document.body.appendChild(error);
    const { top, left } = target.getBoundingClientRect();
    error.style.top = `${
      window.scrollY + top - target.offsetHeight + error.offsetHeight
    }px`;
    error.style.left = `${window.scrollX + left}px`;
  }

  deleteError() {
    if (document.querySelector(".form-error")) {
      document.querySelector(".form-error").remove();
    }
  }
}
