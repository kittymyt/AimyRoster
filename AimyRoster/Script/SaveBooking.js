$(function () {
    function saveData() {
        $.ajax({
            url: "/Home/SaveBooking",
            datatype: "json",
            type: "POST",
            data: { bookingDetails: unsavedTasks }
        })
    }
})