using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.StaticFiles;
using System.Text.Json.Serialization;
using CMS.Data;
using CMS.Backend.Helpers;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);


// ======================================================
// REGISTER SERVICES
// ======================================================

// Email Service
builder.Services.AddSingleton<EmailService>();

// Controllers + JSON
builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// ======================================================
// DATABASE
// ======================================================

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// ======================================================
// CORS
// ======================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:3002",
                "http://localhost:3003",
                "http://localhost:3004",
                "http://localhost:3005"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
// ======================================================
// AUTHENTICATION COOKIE
// ======================================================

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Login";
        options.LogoutPath = "/Account/Logout";
        options.AccessDeniedPath = "/Account/AccessDenied";

        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;

        options.Cookie.HttpOnly = true;
        options.Cookie.Name = "ThienCMS.Auth";

        // QUAN TRỌNG CHO API + REACT
        options.Events.OnRedirectToLogin = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = 401;
                return Task.CompletedTask;
            }

            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        };

        options.Events.OnRedirectToAccessDenied = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = 403;
                return Task.CompletedTask;
            }

            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        };
    });

// ======================================================
// SWAGGER
// ======================================================

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();


// ======================================================
// BUILD APP
// ======================================================

var app = builder.Build();


// ======================================================
// PIPELINE
// ======================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ThienCMS API v1");
    });
}
else
{
    app.UseExceptionHandler("/Home/Error");

    app.UseHsts();
}


// ======================================================
// HTTPS
// ======================================================

app.UseHttpsRedirection();


// ======================================================
// STATIC FILES
// ======================================================

var provider = new FileExtensionContentTypeProvider();

// Hỗ trợ .jfif
provider.Mappings[".jfif"] = "image/jpeg";

app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = provider
});


// ======================================================
// ROUTING
// ======================================================

app.UseRouting();


// ======================================================
// CORS
// ======================================================


app.UseCors("AllowFrontend");

app.Use(async (context, next) =>
{
    context.Response.Headers.Append("Access-Control-Allow-Origin", "http://localhost:3005");
    context.Response.Headers.Append("Access-Control-Allow-Headers", "*");
    context.Response.Headers.Append("Access-Control-Allow-Methods", "*");
    context.Response.Headers.Append("Access-Control-Allow-Credentials", "true");

    if (context.Request.Method == "OPTIONS")
    {
        context.Response.StatusCode = 200;
        return;
    }

    await next();
});


// ======================================================
// AUTH
// ======================================================

app.UseAuthentication();

app.UseAuthorization();


// ======================================================
// SEED DATA
// ======================================================

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();

        // Seed Categories
        if (!context.CategoryProducts.Any())
        {
            context.CategoryProducts.AddRange(
                new CMS.Data.Entities.CategoryProduct
                {
                    Name = "Điện thoại",
                    Description = "Điện thoại di động & Smartphone"
                },

                new CMS.Data.Entities.CategoryProduct
                {
                    Name = "Laptop",
                    Description = "Máy tính xách tay"
                },

                new CMS.Data.Entities.CategoryProduct
                {
                    Name = "Phụ kiện",
                    Description = "Phụ kiện công nghệ"
                },

                new CMS.Data.Entities.CategoryProduct
                {
                    Name = "Gia dụng",
                    Description = "Thiết bị điện gia dụng"
                }
            );

            context.SaveChanges();
        }

        // Seed Admin
        if (!context.Users.Any())
        {
            context.Users.Add(new CMS.Data.Entities.User
            {
                Username = "admin",
                PasswordHash = "admin123",
                FullName = "Quản trị viên",
                Role = "Admin"
            });

            context.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine(ex.Message);
    }
}


// ======================================================
// ROUTES
// ======================================================

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}"
);


// ======================================================
// RUN
// ======================================================
app.MapControllers();
app.Run();