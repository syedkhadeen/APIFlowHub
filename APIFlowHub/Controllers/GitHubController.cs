using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.Linq;
using Microsoft.Extensions.Logging;

namespace APIFlowHub.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GitHubController : ControllerBase
    {
        private readonly IHttpClientFactory _clientFactory;
        private readonly ILogger<GitHubController> _logger;

        public GitHubController(IHttpClientFactory clientFactory, ILogger<GitHubController> logger)
        {
            _clientFactory = clientFactory;
            _logger = logger;
        }

        public class GitHubImportRequest
        {
            public string Url { get; set; }
            public string Token { get; set; } // Optional GitHub API token
        }

        public class ParsedApiNode
        {
            public string Method { get; set; }
            public string Url { get; set; }
            public string Body { get; set; }
            public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>();
        }

        [HttpPost("import")]
        public async Task<IActionResult> ImportFromGitHub([FromBody] GitHubImportRequest request)
        {
            if (string.IsNullOrEmpty(request.Url))
            {
                return BadRequest("GitHub URL is required.");
            }

            string rawUrl;
            try
            {
                var uri = new Uri(request.Url);
                if (uri.Host.Equals("raw.githubusercontent.com", StringComparison.OrdinalIgnoreCase))
                {
                    rawUrl = request.Url;
                }
                else if (uri.Host.Equals("github.com", StringComparison.OrdinalIgnoreCase))
                {
                    // Convert github.com/user/repo/blob/branch/file to raw.githubusercontent.com/user/repo/branch/file
                    rawUrl = $"https://raw.githubusercontent.com{uri.AbsolutePath.Replace("/blob/", "/")}";
                }
                else
                {
                    return BadRequest("URL must be a valid github.com or raw.githubusercontent.com link.");
                }
            }
            catch (UriFormatException)
            {
                return BadRequest("Invalid URL format.");
            }

            _logger.LogInformation("Attempting to fetch from raw GitHub URL: {RawUrl}", rawUrl);

            var client = _clientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("User-Agent", "APIFlowHub");
            if (!string.IsNullOrWhiteSpace(request.Token))
            {
                client.DefaultRequestHeaders.Add("Authorization", $"token {request.Token}");
            }

            HttpResponseMessage response;
            try
            {
                response = await client.GetAsync(rawUrl);
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    _logger.LogWarning("GitHub API returned 404 Not Found for URL: {RawUrl}", rawUrl);
                    return NotFound("The requested file was not found on GitHub. Please check the URL and ensure the file exists.");
                }
                response.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException e)
            {
                _logger.LogError(e, "Failed to fetch file from GitHub URL: {RawUrl}", rawUrl);
                return StatusCode(502, $"Failed to fetch file from GitHub: {e.Message}");
            }

            var content = await response.Content.ReadAsStringAsync();
            var parsedNodes = new List<ParsedApiNode>();

            try
            {
                using (JsonDocument doc = JsonDocument.Parse(content))
                {
                    var root = doc.RootElement;
                    string baseUrl = "";

                    // Extract base URL from OpenAPI/Swagger spec
                    if (root.TryGetProperty("servers", out var servers) && servers.EnumerateArray().Any())
                    {
                        baseUrl = servers.EnumerateArray().First().GetProperty("url").GetString() ?? "";
                    }
                    else if (root.TryGetProperty("host", out var host)) // For older Swagger versions
                    {
                        var scheme = root.TryGetProperty("schemes", out var schemes) && schemes.EnumerateArray().Any() ? schemes.EnumerateArray().First().GetString() : "http";
                        baseUrl = $"{scheme}://{host.GetString()}";
                    }

                    if (root.TryGetProperty("paths", out var paths))
                    {
                        foreach (var path in paths.EnumerateObject())
                        {
                            var pathUrl = path.Name;
                            foreach (var method in path.Value.EnumerateObject())
                            {
                                var httpMethod = method.Name.ToUpper();
                                parsedNodes.Add(new ParsedApiNode
                                {
                                    Method = httpMethod,
                                    Url = $"{baseUrl.TrimEnd('/')}{pathUrl}",
                                });
                            }
                        }
                    }
                    else
                    {
                        return BadRequest("File does not appear to be a valid OpenAPI/Swagger specification (missing 'paths').");
                    }
                }
                return Ok(parsedNodes);
            }
            catch (JsonException e)
            {
                return BadRequest($"Failed to parse the file content as JSON. Error: {e.Message}");
            }
        }
    }
} 