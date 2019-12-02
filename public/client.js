// client-side js
// run by the browser each time your view template referencing it is loaded

const people = [];
const submitted = localStorage.getItem('submitted');

// define variables that reference elements on our page
const peopleForm = document.forms[0];
const nameInput = peopleForm.elements["name"];
const phoneInput = peopleForm.elements["phone"];
const peopleList = document.getElementById("people");
const afterSubmit = document.getElementById("after-submit");
const clearButton = document.querySelector('#clear-people');

// request the people from our app's sqlite database
fetch("/getPeople", {})
  .then(res => res.json())
  .then(response => {
    response.forEach(row => {
      appendNewPerson(row.name);
    });
  });

// a helper function that creates a list item for a given person
const appendNewPerson = name => {
  const newListItem = document.createElement("li");
  newListItem.innerText = name;
  peopleList.appendChild(newListItem);
};

if (submitted == 'true') {
  // hide form & show after-submit
  peopleForm.style.display = "none";
  afterSubmit.style.display = "block";
} else {
  peopleForm.style.display = "block";
  afterSubmit.style.display = "none";
}

// listen for the form to be submitted and add a new person when it is
peopleForm.onsubmit = event => {
  // stop our form submission from refreshing the page
  event.preventDefault();

  const data = { name: nameInput.value, phone: phoneInput.value };

  fetch("/addPerson", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(response => {
      console.log(JSON.stringify(response));
    });
  // get person value and add it to the list
  people.push(data);
  appendNewPerson(nameInput.value);

  // reset form
  nameInput.value = "";
  phoneInput.value = "";
  nameInput.focus();
  
  localStorage.setItem('submitted','true')
  
  // hide form & show after-submit
  peopleForm.style.display = "none";
  afterSubmit.style.display = "block";
};

clearButton.addEventListener('click', event => {
  fetch("/clearPeople", {})
    .then(res => res.json())
    .then(response => {
      console.log("cleared people");
    });
  peopleList.innerHTML = "";
});
