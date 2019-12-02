let adminToken = localStorage.getItem("adminToken");
let people = [];

// define variables that reference elements on our page
const adminForm = document.forms[0];
const tokenInput = adminForm.elements["token"];
const peopleList = document.getElementById("people");
const adminView = document.getElementById("people-admin");
const unauthorizedView = document.getElementById("unauthorized");
const clearButton = document.querySelector("#clear-people");
const sendSecretSantaButton = document.querySelector("#send-secret-santa")
const controlPanelView = document.getElementById("control-panel")

const getPeople = token => {
  fetch("/getPeople", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(response => {
      if (response.status == 200) {
        people = response.people;
        if (people.length > 0) {
          people.forEach(row => {
            appendNewPerson(row);
          });
          clearButton.style.display = "block";
          controlPanelView.style.display = "block";
        } else {
          peopleList.innerHTML = "<p>No people available…</p>";
          clearButton.style.display = "none";
          controlPanelView.style.display = "none";
        }
        unauthorizedView.style.display = "none";
        adminView.style.display = "block";
      } else {
        adminView.style.display = "none";
        unauthorizedView.style.display = "block";
      }
    });
};

const appendNewPerson = data => {
  const newListItem = document.createElement("li");
  newListItem.innerHTML = `${data.name}, ${data.phone}. <a href="javascript:deletePerson(${data.id}, '${data.name}');">Delete?</a>`;
  peopleList.appendChild(newListItem);
};

const clearPeople = (token, count) => {
  if (count > 0) {
    const confirmation = confirm(
      `Are you sure you want to delete ${count} ${
        count == 1 ? "person" : "people"
      }?`
    );
    if (confirmation) {
      fetch("/clearPeople", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(response => {
          getPeople(adminToken)
        });
    }
  } else {
    alert("No people found! Get some friends.");
  }
};

const deletePerson = (id, name) => {
  const confirmation = confirm(`Are you sure you want to delete ${name}?`);
  if (confirmation) {
    fetch("/deletePerson", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id
      })
    })]
      .then(res => res.json())
      .then(response => {
        console.log(response);
        if (response.status == 200) {
          console.log(`deleted id ${id}`);
        }
      });
    peopleList.innerHTML = "";
    getPeople(adminToken);
  }
};

const sendSecretSanta = () => {
  if (people.length > 1) {
    const confirmation = confirm(`Are you sure you want to text all ${people.length} people?`);
    if (confirmation) {
      fetch("/sendSecretSanta", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      })
        .then(res => res.json())
        .then(response => {
          console.log(response);
          if (response.status == 200) {
            console.log(`assigned`);
          }
        });
      peopleList.innerHTML = "";
      getPeople(adminToken);
    }
  } else {
    alert('You need more than one person, silly!')
  }
}

if (adminToken !== null) {
  if (adminToken !== "") {
    tokenInput.value = adminToken;
    getPeople(adminToken);
  }
}

adminForm.onsubmit = event => {
  // stop our form submission from refreshing the page
  event.preventDefault();

  const token = tokenInput.value;
  getPeople(token);

  localStorage.setItem("adminToken", token);
};

clearButton.addEventListener("click", event => {
  clearPeople(adminToken, people.length);
});

sendSecretSantaButton.addEventListener("click", event => {
  clearPeople(adminToken, people.length);
});
