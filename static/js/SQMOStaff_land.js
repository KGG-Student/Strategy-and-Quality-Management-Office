let isAdmin = false;
let programs = [];

const adminToggle = document.getElementById("adminToggle");
const addBtn     = document.getElementById("addBtn");
const container  = document.getElementById("programs");

async function fetchPrograms() {
    const res  = await fetch('/api/programs');
    programs   = await res.json();   // [{id, p_name}, ...]
    populateProgramDropdown();
    render();
}

async function addProgram(name) {
    const res = await fetch('/api/programs', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ p_name: name })
    });
    const p = await res.json();
    programs.push(p);
    render();
}

async function updateProgram(id, name) {
    await fetch(`/api/programs/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ p_name: name })
    });
    programs.find(p => p.id === id).p_name = name;
    render();
}

async function deleteProgram(id) {
    await fetch(`/api/programs/${id}`, { method: 'DELETE' });
    programs = programs.filter(p => p.id !== id);
    render();
}
const programSelect = document.getElementById("programSelect");

function populateProgramDropdown() {
    if (!programSelect) return;

    programSelect.innerHTML =
        `<option value="" disabled selected>Select Program</option>`;

    programs.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.p_name;
        programSelect.appendChild(option);
    });
}
function render() {
    container.innerHTML = "";
    programs.forEach(p => {
        const wrapper = document.createElement("div");
        wrapper.className = "program-wrapper";

        const btn = document.createElement("button");
        btn.className = "program_btn";
        btn.textContent = p.p_name;
        btn.onclick = () => {
            if (!isAdmin) btn.classList.add("disabled");
        };
        wrapper.appendChild(btn);

        if (isAdmin) {
            const controls = document.createElement("div");
            controls.className = "controls";

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.className = "editBtn";
            editBtn.onclick = () => {
                const newName = prompt("Edit name:", p.p_name);
                if (newName) updateProgram(p.id, newName);
            };

            const delBtn = document.createElement("button");
            delBtn.textContent = "X";
            delBtn.className = "deleteBtn";
            delBtn.onclick = () => deleteProgram(p.id);

            controls.appendChild(editBtn);
            controls.appendChild(delBtn);
            wrapper.appendChild(controls);
        }

        container.appendChild(wrapper);
    });
}

adminToggle.onclick = () => {
    isAdmin = !isAdmin;
    adminToggle.textContent = isAdmin ? "Edit: ON" : "Edit: OFF";
    addBtn.style.display = isAdmin ? "inline-block" : "none";
    render();
};

addBtn.onclick = () => {
    const name = prompt("Program name:");
    if (name) addProgram(name);
};

fetchPrograms();