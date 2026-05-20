const allButtons = document.querySelectorAll(".report_btn, .ndreport_btn");

allButtons.forEach(btn => {
    const reportKey = btn.dataset.key;

    btn.addEventListener("click", async () => {
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
    });
});