let token = "";

function login() {
    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: document.getElementById("username").value
        })
    })
        .then(res => res.json())
        .then(data => {
            token = data.token;
            alert("Logged in!");
        });
}

function search() {
    fetch("/api/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
            query: document.getElementById("search").value
        })
    })
        .then(res => res.json())
        .then(data => {
            document.getElementById("output").innerText =
                JSON.stringify(data, null, 2);
        });
}

function isSupervisor() {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role === "supervisor";
}

function exportData() {
    if (!isSupervisor()) {
        alert("Export available only to supervisors");
        return;
    }

    fetch("/api/export", {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
        .then(res => res.text())
        .then(data => {
            document.getElementById("output").innerText = data;
        });
}
