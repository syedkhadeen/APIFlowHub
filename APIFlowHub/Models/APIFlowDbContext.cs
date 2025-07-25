using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace APIFlowHub.Backend.Models;

public partial class APIFlowDbContext : DbContext
{
    public APIFlowDbContext()
    {
    }

    public APIFlowDbContext(DbContextOptions<APIFlowDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<ApiEndpoint> ApiEndpoints { get; set; }

    public virtual DbSet<Flow> Flows { get; set; }

    public virtual DbSet<FlowNode> FlowNodes { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {

    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ApiEndpoint>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("api_endpoints_pkey");

            entity.ToTable("api_endpoints");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Body).HasColumnName("body");
            entity.Property(e => e.HeadersJson).HasColumnName("headers_json");
            entity.Property(e => e.Method).HasColumnName("method");
            entity.Property(e => e.Url).HasColumnName("url");
        });

        modelBuilder.Entity<Flow>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("flows_pkey");

            entity.ToTable("flows");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name");
        });

        modelBuilder.Entity<FlowNode>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("flow_nodes_pkey");

            entity.ToTable("flow_nodes");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.EndpointId).HasColumnName("endpoint_id");
            entity.Property(e => e.ExecutionOrder).HasColumnName("execution_order");
            entity.Property(e => e.FlowId).HasColumnName("flow_id");

            entity.HasOne(d => d.Endpoint).WithMany(p => p.FlowNodes)
                .HasForeignKey(d => d.EndpointId)
                .HasConstraintName("flow_nodes_endpoint_id_fkey");

            entity.HasOne(d => d.Flow).WithMany(p => p.FlowNodes)
                .HasForeignKey(d => d.FlowId)
                .HasConstraintName("flow_nodes_flow_id_fkey");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
