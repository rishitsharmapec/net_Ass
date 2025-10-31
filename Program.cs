using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<TaskDbContext>(options =>
    options.UseInMemoryDatabase("TaskDb"));

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact",
        policy => policy
            .WithOrigins("http://localhost:3000", "http://localhost:5173")
            .AllowAnyMethod()
            .AllowAnyHeader());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");

// GET: Get all tasks
app.MapGet("/api/tasks", async (TaskDbContext db) =>
{
    var tasks = await db.Tasks.OrderBy(t => t.Id).ToListAsync();
    return Results.Ok(tasks);
})
.WithName("GetTasks");

// POST: Create a new task
app.MapPost("/api/tasks", async (TaskDbContext db, TaskItemDto taskDto) =>
{
    if (string.IsNullOrWhiteSpace(taskDto.Description))
    {
        return Results.BadRequest("Description is required");
    }

    var task = new TaskItem
    {
        Description = taskDto.Description,
        IsCompleted = false,
        CreatedAt = DateTime.UtcNow
    };

    db.Tasks.Add(task);
    await db.SaveChangesAsync();

    return Results.Created($"/api/tasks/{task.Id}", task);
})
.WithName("CreateTask");

// PUT: Update task completion status
app.MapPut("/api/tasks/{id}", async (TaskDbContext db, int id, TaskUpdateDto updateDto) =>
{
    var task = await db.Tasks.FindAsync(id);
    
    if (task is null)
    {
        return Results.NotFound($"Task with ID {id} not found");
    }

    task.IsCompleted = updateDto.IsCompleted;
    await db.SaveChangesAsync();

    return Results.Ok(task);
})
.WithName("UpdateTask");

// DELETE: Delete a task
app.MapDelete("/api/tasks/{id}", async (TaskDbContext db, int id) =>
{
    var task = await db.Tasks.FindAsync(id);
    
    if (task is null)
    {
        return Results.NotFound($"Task with ID {id} not found");
    }

    db.Tasks.Remove(task);
    await db.SaveChangesAsync();

    return Results.NoContent();
})
.WithName("DeleteTask");

app.Run();

// Models
public class TaskItem
{
    public int Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
}

public record TaskItemDto(string Description);

public record TaskUpdateDto(bool IsCompleted);

// Database Context
public class TaskDbContext : DbContext
{
    public TaskDbContext(DbContextOptions<TaskDbContext> options) : base(options) 
    {
    }
    
    public DbSet<TaskItem> Tasks { get; set; } = null!;
}