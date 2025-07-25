using System;
using System.Collections.Generic;

namespace APIFlowHub.Backend.Models;

public partial class ApiEndpoint
{
    public int Id { get; set; }

    public string Url { get; set; } = null!;

    public string Method { get; set; } = null!;

    public string? HeadersJson { get; set; }

    public string? Body { get; set; }

    public virtual ICollection<FlowNode> FlowNodes { get; set; } = new List<FlowNode>();
}
