using APIFlowHub.Backend.Models;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace APIFlowHub.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FlowController : ControllerBase
    {
        private readonly APIFlowDbContext _context;

        public FlowController(APIFlowDbContext context)
        {
            _context = context;
        }

        public class FlowSaveRequest
        {
            public string Name { get; set; }
            public object FlowData { get; set; }
        }

        [HttpPost("save")]
        public async Task<IActionResult> SaveFlow([FromBody] FlowSaveRequest request)
        {
            if (string.IsNullOrEmpty(request.Name) || request.FlowData == null)
            {
                return BadRequest("Flow name and data are required.");
            }

            var flow = new Flow
            {
                Name = request.Name,
                FlowDataJson = JsonSerializer.Serialize(request.FlowData)
            };

            _context.Flows.Add(flow);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Flow saved successfully!", flowId = flow.Id });
        }

        [HttpGet("list")]
        public IActionResult ListFlows()
        {
            var flows = _context.Flows
                .Select(f => new { f.Id, f.Name })
                .ToList();

            return Ok(flows);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetFlow(int id)
        {
            var flow = await _context.Flows.FindAsync(id);

            if (flow == null || string.IsNullOrEmpty(flow.FlowDataJson))
            {
                return NotFound();
            }

            return Content(flow.FlowDataJson, "application/json");
        }
    }
}
