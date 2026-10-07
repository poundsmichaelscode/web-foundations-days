const loadUsersButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const status = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

let users = [];

/*
  Draws any array of users on the page.
*/
function renderUsers(list) {
  usersList.textContent = "";

  if (list.length === 0) {
    const message = document.createElement("li");
    message.textContent = "No users match your filter.";
    usersList.appendChild(message);
    return;
  }

  list.forEach((user) => {
    const listItem = document.createElement("li");

    const name = document.createElement("h2");
    name.textContent = user.name;

    const email = document.createElement("p");
    email.textContent = `Email: ${user.email}`;

    const city = document.createElement("p");
    city.textContent = `City: ${user.address.city}`;

    const company = document.createElement("p");
    company.textContent = `Company: ${user.company.name}`;

    listItem.append(name, email, city, company);

    usersList.appendChild(listItem);
  });
}

/*
  Fetches users from JSONPlaceholder.
*/
async function loadUsers() {
  status.textContent = "Loading users...";
  loadUsersButton.disabled = true;

  try {
    const response = await fetch(
      "https://jsonplaceholder.typicode.com/users"
    );

    if (!response.ok) {
      throw new Error(
        `Request failed with status ${response.status}`
      );
    }

    users = await response.json();

    renderUsers(users);

    status.textContent =
      `Successfully loaded ${users.length} users.`;
  } catch (error) {
    users = [];
    usersList.textContent = "";

    status.textContent =
      "Unable to load users. Please try again.";

    console.error("Failed to load users:", error);
  } finally {
    loadUsersButton.disabled = false;
  }
}

/*
  Load button.
*/
loadUsersButton.addEventListener("click", loadUsers);

/*
  Filter the already-loaded users.

  This does not make another API request.
*/
filterInput.addEventListener("input", () => {
  const filterText = filterInput.value
    .trim()
    .toLowerCase();

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(filterText)
  );

  renderUsers(filteredUsers);
});
