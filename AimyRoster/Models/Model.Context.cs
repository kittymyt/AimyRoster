﻿//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace AimyRoster.Models
{
    using System;
    using System.Data.Entity;
    using System.Data.Entity.Infrastructure;
    
    public partial class RosterEntities : DbContext
    {
        public RosterEntities()
            : base("name=RosterEntities")
        {
        }
    
        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            throw new UnintentionalCodeFirstException();
        }
    
        public virtual DbSet<Sites> Sites { get; set; }
        public virtual DbSet<Staffs> Staffs { get; set; }
        public virtual DbSet<StaffRoster> StaffRoster { get; set; }
    }
}
