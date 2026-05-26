const clock = document.getElementById('clock');
const dateLabel = document.getElementById('date');

const updateDateTime = () => {
  const now = new Date();
  if (clock) {
    clock.textContent = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  if (dateLabel) {
    dateLabel.textContent = now.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }
};

updateDateTime();
setInterval(updateDateTime, 30000);
