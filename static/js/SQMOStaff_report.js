let editMode = false;

const editBtn = document.querySelector(".edit_btn");
const allButtons = document.querySelectorAll(".report_btn, .ndreport_btn");

function toggleEdit() {
    editMode = !editMode;
    editBtn.textContent = editMode ? "Edit: ON" : "Edit: OFF";
}

allButtons.forEach(btn => {
    const reportKey = btn.dataset.key;

    btn.addEventListener("click", async () => {

        /* =========================
           EDIT MODE
        ========================== */
        if (editMode) {

            // 1. Get existing link from backend
            let existing = "";
            try {
                const res = await fetch(`/api/links/${PROGRAM_ID}/${reportKey}`);
                if (res.ok) {
                    const data = await res.json();
                    existing = data.url || "";
                }
            } catch (e) {}

            let newLink = prompt(
                "Input Google Drive Link (leave empty to delete):",
                existing
            );

            if (newLink === null) return;

            newLink = newLink.trim();

            /* DELETE */
            if (newLink === "") {
                if (confirm("Delete this link?")) {
                    await fetch(`/api/links/${PROGRAM_ID}/${reportKey}`, {
                        method: "DELETE"
                    });
                    alert("Link deleted!");
                }
                return;
            }

            /* FIX RELATIVE URLs */
            if (!/^https?:\/\//i.test(newLink)) {
                newLink = "https://" + newLink;
            }

            /* SAVE */
            await fetch("/api/links", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    program_id: PROGRAM_ID,
                    report_key: reportKey,
                    url: newLink
                })
            });

            alert("Link saved!");
        }

        /* =========================
           VIEW MODE
        ========================== */
        else {
            try {
                const res = await fetch(`/api/links/${PROGRAM_ID}/${reportKey}`);
                if (!res.ok) {
                    alert("No link assigned yet.");
                    return;
                }

                const data = await res.json();
                window.open(data.url, "_blank");
            } catch (e) {
                alert("Server error.");
            }
        }
    });
});