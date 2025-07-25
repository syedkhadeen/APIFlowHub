using APIFlowHub.Backend.Models;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace APIFlowHub.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CurlController : ControllerBase
    {
        private readonly APIFlowDbContext _context;

        public CurlController(APIFlowDbContext context)
        {
            _context = context;
        }

        public class CurlInput
        {
            public string CurlCommand { get; set; } = string.Empty;
        }

        public class CurlImportRequest
        {
            public string Curl { get; set; }
        }

        [HttpPost("import")]
        [Consumes("text/plain")]
        public async Task<IActionResult> Import([FromBody] string curlCommands)
        {
            // Split multiple curl commands by looking for "curl" at the beginning of a line
            var commands = Regex.Split(curlCommands, @"(?m)^\s*curl", RegexOptions.IgnoreCase)
                .Where(cmd => !string.IsNullOrWhiteSpace(cmd))
                .Select(cmd => "curl" + cmd)
                .ToList();

            if (commands.Count == 0)
            {
                return BadRequest(new { message = "No valid curl commands found" });
            }

            var endpoints = new List<ApiEndpoint>();

            foreach (var command in commands)
            {
                var endpoint = ParseCurlCommand(command);
                if (endpoint != null)
                {
                    _context.ApiEndpoints.Add(endpoint);
                    endpoints.Add(endpoint);
                }
            }

            await _context.SaveChangesAsync();

            if (endpoints.Count == 1)
            {
                return Ok(new { message = "Imported successfully", endpoint = endpoints[0] });
            }
            else
            {
                return Ok(new { message = $"Imported {endpoints.Count} commands successfully", endpoints = endpoints });
            }
        }

        private ApiEndpoint ParseCurlCommand(string curlCommand)
        {
            var url = "";
            var method = "GET";
            var headers = new Dictionary<string, string>();
            var body = "";

            // Handle line continuations (backslash followed by newline)
            curlCommand = Regex.Replace(curlCommand, @"\\
?\n\s*", " ");

            var tokens = curlCommand.Split(' ');

            for (int i = 0; i < tokens.Length; i++)
            {
                if (tokens[i] == "-X" && i + 1 < tokens.Length)
                    method = tokens[i + 1];
                else if (tokens[i].Contains("http"))
                    url = tokens[i].Trim('"', '`');
                else if (tokens[i] == "-H" && i + 1 < tokens.Length)
                {
                    var header = tokens[i + 1].Trim('"', '`');
                    var parts = header.Split(':', 2);
                    if (parts.Length == 2)
                        headers[parts[0].Trim()] = parts[1].Trim();
                }
                else if (tokens[i] == "-d" && i + 1 < tokens.Length)
                    body = tokens[i + 1].Trim('\'', '"', '`');
            }

            if (string.IsNullOrEmpty(url))
                return null;

            return new ApiEndpoint
            {
                Url = url,
                Method = method,
                HeadersJson = JsonSerializer.Serialize(headers),
                Body = body
            };
        }

        [HttpGet("list")]
        public IActionResult ListImportedEndpoints()
        {
            var endpoints = _context.ApiEndpoints.ToList();
            return Ok(endpoints);
        }
    }
}
