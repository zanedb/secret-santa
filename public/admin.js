let adminToken = localStorage.getItem("adminToken");

// define variables that reference elements on our page
const adminForm = document.forms[0];
const tokenInput = adminForm.elements["token"];
const peopleList = document.getElementById("people");
const adminView = document.getElementById("people-admin");
const unauthorizedView = document.getElementById("unauthorized");
const clearButton = document.querySelector("#clear-people");

const getPeople = token => {
  fetch("/getPeople", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(response => {
      if (response.status == 200) {
        response.people.forEach(row => {
          appendNewPerson(row.name, row.phone);
        });
        unauthorizedView.style.display = "none";
        adminView.style.display = "block";
      } else {
        adminView.style.display = "none";
        unauthorizedView.style.display = "block";
      }
    });
};

const appendNewPerson = (name, phone) => {
  const newListItem = document.createElement("li");
  newListItem.innerText = `${name}, ${phone}`;
  peopleList.appendChild(newListItem);
};

const clearPeople = token => {
  fetch("/clearPeople", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(response => {
      console.log("cleared people");
    });
  peopleList.innerHTML = "";
};

if (adminToken !== null) {
  if (adminToken !== '') {
    tokenInput.value = adminToken
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
  clearPeople(adminToken);
});
