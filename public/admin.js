let adminToken = localStorage.getItem("adminToken");

// define variables that reference elements on our page
const adminForm = document.forms[0];
const tokenInput = adminForm.elements["token"];
const peopleList = document.getElementById("people");
const adminView = document.getElementById("people-admin");
const clearButton = document.querySelector("#clear-people");

// request the people from our app's sqlite database
const getPeople = token => {
  fetch("/getPeople", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(response => {
      response.forEach(row => {
        appendNewPerson(row.name, row.phone);
      });
      adminView.style.display = "block";
    });
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

// a helper function that creates a list item for a given person
const appendNewPerson = (name, phone) => {
  const newListItem = document.createElement("li");
  newListItem.innerText = `${name}, ${phone}`;
  peopleList.appendChild(newListItem);
};

if (adminToken !== null) {
  tokenInput.value = adminToken
  getPeople(adminToken);
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
