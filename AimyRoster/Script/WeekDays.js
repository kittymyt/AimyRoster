$(document).ready(function () {

    var viewingDate = getCurrentMonday();

    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
          "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"
    ];

    var weekNames = ["Sun","Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    initialDateLine();

    updateWeekButtons();

    changeButtonColor();


    $(".btnWeekSel").click(function () {

        //if (unsavedTasks.length > 0 || deleteTasks.length > 0) {
        //    saveChanges();
        //}

        var tableMonday = new Date($(this).val());

        updateDateTitle(tableMonday);
        changeButtonColor();

        filter = $('#comboFilter').val();
        if ((filter == undefined) || (filter == "")) {
            updategrid(siteId);
        }
        else {
            switch (filterSource) {
                case "Staff":
                    filterGrid(siteId, filterId)
                    return;
                case "Reference":
                    updategrid(siteId)
                    return;
            }
        }
    });

    //renew the th based on the week user select
    //$("#btnWeekA,#btnWeekB,#btnWeekC").click(function () {
        
    //});


    $("#btnNextWeek").click(function () {
        nextWeek();
        updateWeekButtons();
        changeButtonColor();
    });

    $("#btnPreviousWeek").click(function () {
        previousWeek();
        updateWeekButtons();
        changeButtonColor();
    });

    $("#btnToday").click(function () {
        viewingDate = getCurrentMonday()
        updateWeekButtons();

        initialDateLine();

        changeButtonColor();

        filter = $('#comboFilter').val();
        if ((filter == undefined) || (filter == "")) {
            updategrid(siteId);
        }
        else {
            switch (filterSource) {
                case "Staff":
                    filterGrid(siteId, filterId)
                    return;
                case "Reference":
                    updategrid(siteId)
                    return;
            }
        }
    });

    


    function changeButtonColor() {
        var buttonADate = $("#btnWeekA").val().slice(4, 15);
        var buttonBDate = $("#btnWeekB").val().slice(4, 15);
        var buttonCDate = $("#btnWeekC").val().slice(4, 15);
        var dayLessThanTen;

        if ($("th:eq(0)").data("date").getDate() < 10)
        {
            dayLessThanTen = "0" + $("th:eq(0)").data("date").getDate();
            var headerDate = monthNames[$("th:eq(0)").data("date").getMonth()] + " " + dayLessThanTen + " " + $("th:eq(0)").data("date").getFullYear();
        }
        else {
            var headerDate = monthNames[$("th:eq(0)").data("date").getMonth()] + " " + $("th:eq(0)").data("date").getDate() + " " + $("th:eq(0)").data("date").getFullYear();
        }

        if (buttonADate == headerDate) {
            $("button.active").removeClass("active").addClass("btn-info");
            $("#btnWeekA").removeClass("btn-info").addClass("active");
        }else if(buttonBDate == headerDate)
        {
            $("button.active").removeClass("active").addClass("btn-info");
            $("#btnWeekB").removeClass("btn-info").addClass("active");
        }else if(buttonCDate == headerDate)
        {
            $("button.active").removeClass("active").addClass("btn-info");
            $("#btnWeekC").removeClass("btn-info").addClass("active");
        }
        else {
            $("button").removeClass("active").addClass("btn-info");
        }
    }

    function updateWeekButtons() {
        $("#btnWeekA").html(getWeekSignature(viewingDate));
        $("#btnWeekA").attr('value', viewingDate);


        var weekB = new Date(viewingDate);
        weekB.setDate(weekB.getDate() + 7);

        $("#btnWeekB").html(getWeekSignature(weekB));
        $("#btnWeekB").attr('value', weekB);


        var weekC = new Date(viewingDate);
        weekC.setDate(weekC.getDate() + 14);

        $("#btnWeekC").html(getWeekSignature(weekC));
        $("#btnWeekC").attr('value', weekC);
    }


    //returns the monday before the given date
    function getCurrentMonday() {
        var d = new Date();
        var n = d.getDay() == 0 ? 7 : d.getDay();
        var mon = new Date(d - (n - 1) * 86400000);

        return mon;
    }


    function getWeekSignature(monday) {


        var lastDay = new Date(monday);
        lastDay.setDate(lastDay.getDate() + 6);

        var weekSignature =
        monday.getDate() + ' ' + monthNames[monday.getMonth()] + " - " + lastDay.getDate() + ' ' + monthNames[lastDay.getMonth()]

        return weekSignature;
    }

    function initialDateLine() {
        var tableMonday = getCurrentMonday();

        var result = '';

        $('th').each(function (index) {

            result = weekNames[tableMonday.getDay()] + ' ' + tableMonday.getDate() + ' ' + monthNames[tableMonday.getMonth()];

            var today = new Date();
            if (tableMonday.getFullYear() == today.getFullYear() && tableMonday.getMonth() == today.getMonth() && tableMonday.getDate() == today.getDate()) {
                $(this).addClass("todayHeader")

            } else {
                $(this).removeClass("todayHeader")
            }

            $(this).html(result);
            $(this).data("date", new Date(tableMonday));
            tableMonday.setDate(tableMonday.getDate() + 1);

        });
    }

    function initializeWeekDays(firstDay) {
        var dates = [firstDay];

        for (i = 1; i < 7; i++) {
            dates[i] = new Date(dates[0]);
            dates[i].setDate(dates[i].getDate() + i);
        }

        return dates;
    }


    function nextWeek() {
        viewingDate.setDate(viewingDate.getDate() + 7);
        initializeWeekDays(viewingDate);
    }

    function previousWeek() {
        viewingDate.setDate(viewingDate.getDate() - 7);
        initializeWeekDays(viewingDate);
    }

    function updateDateTitle(thisMonday) {

        var result = '';
        $('th').each(function (index) {

            result = weekNames[thisMonday.getDay()] + ' ' + thisMonday.getDate() + ' ' + monthNames[thisMonday.getMonth()];
                        
            $(this).data("date", new Date(thisMonday));
            
            //change the color of today's header
            var today = new Date();        
            if (thisMonday.getFullYear() == today.getFullYear() && thisMonday.getMonth() == today.getMonth() && thisMonday.getDate() == today.getDate())
            {              
                $(this).addClass("todayHeader")

            } else
            {
                $(this).removeClass("todayHeader")
            }

            $(this).html(result);

            thisMonday.setDate(thisMonday.getDate() + 1);
            
        });
    }
});

//update grid function
function updategrid(siteId) {
    gridData = new kendo.data.DataSource({
        transport: {
            read: function (options) {
                $.ajax({
                    url: "/Home/GetStaff",
                    data: { getSiteId: siteId },
                    dataType: "json",
                    success: function (response) {
                        var result = response;
                        result.forEach(function (value) {
                            value.Mon = $("th:eq(0)").html().replace(/\s+/g, '');
                            value.Tue = $("th:eq(1)").html().replace(/\s+/g, '');
                            value.Wed = $("th:eq(2)").html().replace(/\s+/g, '');
                            value.Thu = $("th:eq(3)").html().replace(/\s+/g, '');
                            value.Fri = $("th:eq(4)").html().replace(/\s+/g, '');
                            value.Sat = $("th:eq(5)").html().replace(/\s+/g, '');
                            value.Sun = $("th:eq(6)").html().replace(/\s+/g, '');
                        });
                        options.success(result)
                    }
                })
            }
        },
    });

    var startDate = $('th:eq(0)').data("date");
    var readStartDate = (startDate.getFullYear() + "-" + (startDate.getMonth() + 1) + "-" + startDate.getDate());
    var endDate = $('th:eq(6)').data("date");
    var readEndDate = (endDate.getFullYear() + "-" + (endDate.getMonth() + 1) + "-" + (endDate.getDate() + 1));

    initializeTotals()
    var newgrid = $("#scheduler").data("kendoGrid");
    newgrid.setDataSource(gridData);

    filter = $('#comboFilter').val();
    if ((filter == undefined) || (filter == "")) {
        LoadTasks(readStartDate, readEndDate);
    }
    else {
        filterByReference(readStartDate, readEndDate, filterId)
    }

    
}