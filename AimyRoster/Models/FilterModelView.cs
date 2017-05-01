using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace AimyRoster.Models
{
    public class FilterModelView
    {
        public int FltrId { get; set; }
        public string FltrName { get; set; }
        public string FltrDisplay { get; set; }
        public string FltrSource { get; set; }
    }
}