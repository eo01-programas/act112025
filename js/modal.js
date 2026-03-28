(() => {
    let modalTimerInterval = null;
    let modalTimeRemaining = 0;

    const getElement = (id) => document.getElementById(id);

    const getTimerText = () => {
        const timer = getElement("modal-timer");
        return timer ? timer.querySelector("span") : null;
    };

    const hideModal = () => {
        const modal = getElement("loading-modal");
        if (modal) {
            modal.classList.add("hidden");
        }
    };

    const resetCloseButton = () => {
        const closeButton = getElement("modal-close-btn");
        if (closeButton) {
            closeButton.classList.add("hidden");
        }
    };

    const resetSpinner = () => {
        const spinner = getElement("modal-spinner");
        if (spinner) {
            spinner.classList.remove("hidden");
        }
    };

    window.startModalTimer = (estimatedSeconds) => {
        window.stopModalTimer();
        modalTimeRemaining = Number.isFinite(estimatedSeconds) ? estimatedSeconds : 0;

        const timerText = getTimerText();
        const timeRemaining = getElement("modal-time-remaining");
        const timeText = getElement("time-text");

        if (timeRemaining) {
            timeRemaining.classList.remove("hidden");
        }

        const updateDisplay = () => {
            if (!timerText || !timeText) {
                return;
            }

            if (modalTimeRemaining > 0) {
                timerText.textContent = `${modalTimeRemaining}s`;
                timeText.textContent = `${modalTimeRemaining} segundos`;
                return;
            }

            timerText.textContent = "...";
            timeText.textContent = "finalizando...";
        };

        updateDisplay();

        modalTimerInterval = window.setInterval(() => {
            modalTimeRemaining -= 1;
            updateDisplay();

            if (modalTimeRemaining < -30 && timeText) {
                timeText.textContent = "tomando mas de lo esperado...";
            }
        }, 1000);
    };

    window.stopModalTimer = () => {
        if (modalTimerInterval) {
            window.clearInterval(modalTimerInterval);
            modalTimerInterval = null;
        }

        const timerText = getTimerText();
        if (timerText) {
            timerText.textContent = "OK";
        }

        const timeRemaining = getElement("modal-time-remaining");
        if (timeRemaining) {
            timeRemaining.classList.add("hidden");
        }
    };

    window.resetModalTimer = () => {
        window.stopModalTimer();
        const timerText = getTimerText();
        if (timerText) {
            timerText.textContent = "--";
        }
    };

    const closeButton = getElement("modal-close-btn");
    if (closeButton) {
        closeButton.addEventListener("click", () => {
            hideModal();
            resetSpinner();
            resetCloseButton();
            window.stopModalTimer();
        });
    }
})();
