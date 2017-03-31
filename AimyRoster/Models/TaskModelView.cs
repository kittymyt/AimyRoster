using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace AimyRoster.Models
{
    public class TaskModelView
    {
        public int Id { get; set; }
        public int? StaffId { get; set; }
        public int? SiteId { get; set; }
        public string StartDate { get; set; }
        public string EndDate { get; set; }
        public double? SalaryCost { get; set; }
    }
}