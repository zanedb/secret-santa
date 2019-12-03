let people = []

// define variables that reference elements on our page
const peopleForm = document.forms[0]
const nameInput = peopleForm.elements['name']
const phoneInput = peopleForm.elements['phone']
const peopleList = document.getElementById('people')
const peopleView = document.getElementById('people-section')
const afterSubmit = document.getElementById('after-submit')
const clearButton = document.querySelector('#clear-people')

// request the people from our app's sqlite database
const getPeople = () => {
  fetch('/getPeople', {})
    .then(res => res.json())
    .then(response => {
      peopleList.innerHTML = ''

      people = response.people
      if (people.length > 0) {
        peopleView.style.display = 'block'
        people.forEach(row => {
          appendNewPerson(row.name)
        })
      } else {
        peopleView.style.display = 'none'
      }

      // don't allow users to resubmit
      if (localStorage.getItem('submitted') == 'true' && people.length > 0) {
        peopleForm.style.display = 'none'
        afterSubmit.style.display = 'block'
      } else {
        peopleForm.style.display = 'block'
        afterSubmit.style.display = 'none'
      }
    })
}

// a helper function that creates a list item for a given person
const appendNewPerson = name => {
  const newListItem = document.createElement('li')
  newListItem.innerText = name
  peopleList.appendChild(newListItem)
}

getPeople()

// listen for the form to be submitted and add a new person when it is
peopleForm.onsubmit = event => {
  // stop our form submission from refreshing the page
  event.preventDefault()

  const data = { name: nameInput.value, phone: phoneInput.value }

  fetch('/addPerson', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  })
    .then(res => res.json())
    .then(response => {
      // reset form
      nameInput.value = ''
      phoneInput.value = ''

      localStorage.setItem('submitted', 'true')
      getPeople()
    })
}
