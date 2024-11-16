document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("calculateWeightLoss")
    .addEventListener("click", () => {
      const startDate = document.getElementById("startDate").value;
      const endDate = document.getElementById("endDate").value;
      if (!startDate || !endDate) {
        return (document.getElementById("weightLossResult").innerText =
          "Can't be empty");
      }
      // Regular expression to match the "DD/MM/YYYY" format
      const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
      if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
        return (document.getElementById("weightLossResult").innerText =
          "Enter a Date");
      }
      axios
        .post("/calculateWeightLoss", {
          startDate,
          endDate,
        })
        .then((response) => {
          console.log(response.data.result);
          if (isNaN(response.data.result)) {
            return (document.getElementById("weightLossResult").innerText =
              response.data.result);
          }
          document.getElementById("weightLossResult").innerText =
            "your weight loss between these two days is " +
            response.data.result;
        })
        .catch((err) => {
          console.log("Error fetching weight loss data:", err);
        });
    });
});
