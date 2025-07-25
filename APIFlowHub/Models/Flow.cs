using System;
using System.Collections.Generic;

namespace APIFlowHub.Backend.Models;

public partial class Flow
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? FlowDataJson { get; set; }

    public virtual ICollection<FlowNode> FlowNodes { get; set; } = new List<FlowNode>();
}
