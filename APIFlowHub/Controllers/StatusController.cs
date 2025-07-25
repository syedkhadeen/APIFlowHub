using Microsoft.AspNetCore.Mvc;

namespace APIFlowHub.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatusController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new { status = "APIFlowHub is running", timestamp = DateTime.UtcNow });
        }
    }
}
