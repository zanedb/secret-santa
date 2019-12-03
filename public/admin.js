let adminToken = localStorage.getItem('adminToken')
let people = []
let showAssignments = false

// define variables that reference elements on our page
const adminForm = document.forms[0]
const tokenInput = adminForm.elements['token']
const peopleList = document.getElementById('people')
const adminView = document.getElementById('people-admin')
const unauthorizedView = document.getElementById('unauthorized')
const clearButton = document.querySelector('#clear-people')
const assignSecretSantaButton = document.querySelector('#assign-secret-santa')
const sendTextButton = document.querySelector('#send-text')
const showAssignmentsButton = document.querySelector('#show-assignments')
const controlPanelView = document.getElementById('control-panel')

const getPeople = (token, includeAssignments) => {
  showAssignments = includeAssignments
  showAssignmentsButton.innerText = `${
    showAssignments ? 'HIDE' : 'SHOW'
  } SECRET SANTA ASSIGNMENTS`
  fetch('/getPeople', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(response => {
      if (response.status == 200) {
        people = response.people
        peopleList.innerHTML = ''
        if (people.length > 0) {
          people.forEach(row => {
            appendNewPerson(row, showAssignments)
          })
          clearButton.style.display = 'block'
          controlPanelView.style.display = 'block'
        } else {
          peopleList.innerHTML = '<p>No people available…</p>'
          clearButton.style.display = 'none'
          controlPanelView.style.display = 'none'
        }
        unauthorizedView.style.display = 'none'
        adminView.style.display = 'block'
      } else {
        adminView.style.display = 'none'
        unauthorizedView.style.display = 'block'
      }
    })
}

const appendNewPerson = (data, includeAssignments) => {
  const newListItem = document.createElement('li')
  const listItemHTML = includeAssignments
    ? `${data.name}, ${data.phone} (${data.assigned_name}). <a href="javascript:deletePerson(${data.id}, '${data.name}');">Delete?</a>`
    : `${data.name}, ${data.phone}. <a href="javascript:deletePerson(${data.id}, '${data.name}');">Delete?</a>`
  newListItem.innerHTML = listItemHTML
  peopleList.appendChild(newListItem)
}

const clearPeople = (token, count) => {
  if (count > 0) {
    const confirmation = confirm(
      `Are you sure you want to delete ${count} ${
        count == 1 ? 'person' : 'people'
      }?`
    )
    if (confirmation) {
      fetch('/clearPeople', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(response => {
          getPeople(adminToken, false)
        })
    }
  } else {
    alert('No people found! Get some friends.')
  }
}

const deletePerson = (id, name) => {
  const confirmation = confirm(`Are you sure you want to delete ${name}?`)
  if (confirmation) {
    fetch('/deletePerson', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id
      })
    })
      .then(res => res.json())
      .then(response => {
        console.log(response)
        if (response.status == 200) {
          console.log(`deleted id ${id}`)
        }
      })
    getPeople(adminToken, false)
  }
}

const assignSecretSanta = () => {
  if (people.length > 1) {
    let confirmation = false
    if (people[0].assigned_name) {
      confirmation = confirm(
        `Are you sure you want to re-assign Secret Santa names?`
      )
    } else {
      confirmation = true
    }
    if (confirmation) {
      fetch('/assignSecretSanta', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      })
        .then(res => res.json())
        .then(response => {
          console.log(response)
          if (response.status == 200) {
            console.log(`assigned`)
            getPeople(adminToken, false)
          }
        })
    }
  } else {
    alert('You need more than one person, silly!')
  }
}

const sendText = () => {
  if (people.length > 1) {
    if (people[0].assigned_name) {
      const confirmation = confirm(
        `Are you sure you want to text ${people.length} people?`
      )
      if (confirmation) {
        fetch('/sendText', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        })
          .then(res => res.json())
          .then(response => {
            console.log(response)
            if (response.status == 200) {
              console.log(`texts sent!`)
              getPeople(adminToken, false)
            }
          })
      } else {
        alert('You need to assign names first, silly!')
      }
    }
  } else {
    alert('You need more than one person, silly!')
  }
}

const showHideAssignments = () => {
  if (showAssignments) {
    getPeople(adminToken, false)
  } else {
    const confirmation = confirm(
      'Are you sure you’d like to reveal the assignments?'
    )
    if (confirmation) {
      const confirmationTwo = confirm('Are you ABSOLUTELY sure?')
      if (confirmationTwo) getPeople(adminToken, true)
    }
  }
}

if (adminToken !== null) {
  if (adminToken !== '') {
    tokenInput.value = adminToken
    getPeople(adminToken, false)
  }
}

adminForm.onsubmit = event => {
  // stop our form submission from refreshing the page
  event.preventDefault()

  const token = tokenInput.value
  getPeople(token, false)

  localStorage.setItem('adminToken', token)
}

clearButton.addEventListener('click', event => {
  clearPeople(adminToken, people.length)
})

assignSecretSantaButton.addEventListener('click', event => {
  assignSecretSanta()
})

sendTextButton.addEventListener('click', event => {
  sendText()
})

showAssignmentsButton.addEventListener('click', event => {
  showHideAssignments()
})
