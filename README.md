# 21Logic: Blackjack Simulation Engine

## Project Description
This is a simple Blackjack simulator implemented using Spring Boot. The aplplication allows you to simulate multiple rounds of Blackjack, while providing
the recommendation on whether to hit or stand based on basic strategy. The application is designed to be easily extendable for future enhancements.

## Key Features
- Simulates multiple rounds of Blackjack
- Provides basic strategy recommendations such as hit, stand, double down, and split
- Provides player and dealer's bust probability
- Provides dealer's upcard analysis
- Provides an explanation of the basic strategy recommendation

## Technologies Used
For this project, I wanted to explore and learn more about Spring Boot, so I chose it as the primary framework. The project also utilizes:

### Front-end
- Thymeleaf: For server-side rendering of HTML templates
- Bootstrap (v5.36): For responsive and modern UI design
- HTML5: For structuring the web pages
- CSS3 (5.01): For styling the web pages
- JavaScript (ECMAScript 2024): For client-side interactivity

### Back-end
- Java (v21): The main programming language used for the application logic
- Spring Boot (v3.2.4): For building the web application and handling HTTP requests
- Spring MVC: For implementing the Model-View-Controller architecture
- H2 Database: An in-memory database for storing game data during the simulation
- JPA (Java Persistence API): For database interactions and ORM (Object-Relational Mapping)
- Maven: For project management and dependency management
- JUnit5: For unit testing the application components
- Mockito: For mocking dependencies in unit tests
- SLF4J with Logback: For logging application events and errors
- Spring Boot Starter Web & Thymeleaf: For web and template support, RESTful services
- Spring Boot DevTools: For development-time features like automatic restarts and live reload

### Project Management
- Git (2025): Version control system for tracking changes in the codebase
- GitHub (2025): Hosting platform for the Git repository
- Eclipse IDE (2025-09) : Integrated Development Environment for coding and debugging

## Usage

## Project Structure
The project follows a standard Maven project structure:

## Limitations and Future Enhancements

### Limitations
- The current implementation does not include advanced betting strategies or side bets.
- The user interface is basic and could be improved for better user experience.
- The simulation does not account for multiple players or complex game rules variations.
- The application currently runs in a single-threaded mode, which may limit performance for large simulations.

## Future Enhancements
- Implement advanced betting strategies, side bets, insurance options, surrender options, and multi-deck support.
- Simulate actual games of Blackjack with user interaction.
- Include Blackjack variants such as Spanish 21, Free Bet Blackjack, Double Down Madness and more.
- Improve the user interface with more interactive elements and better design.
- Include a database to store historical game data and player statistics.

## How to Run the Application

## About Me
- Name: Ken Lee
- Email: klee474@my.bcit.ca
- GitHub: https://github.com/leeken3

I am a passionate first year software developer studying at BCIT in the Computer Systems Technology program. I have a strong interest and desire to learn more about
back-end development, particularly in Java and Spring Boot. This personal project is a reflection of my enthusiasm for coding and my commitment 
to continuous learning and improvement in the field of software development. I learned plenty of new skills while working on this project as well as encountering
and overcoming various challenges. Feel free to explore the code, provide feedback, or contribute to the project!