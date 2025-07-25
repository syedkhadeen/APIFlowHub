using System;
using System.Collections.Generic;

namespace APIFlowHub.Backend.Models;

public partial class FlowNode
{
    public int Id { get; set; }

    public int? FlowId { get; set; }

    public int? EndpointId { get; set; }

    public int? ExecutionOrder { get; set; }

    public virtual ApiEndpoint? Endpoint { get; set; }

    public virtual Flow? Flow { get; set; }
}
