#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

const HIGHSCORE_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.guess_number_highscores.json');

// Load high scores
async function loadHighScores() {
  try {
    const data = await fs.readFile(HIGHSCORE_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save high score
async function saveHighScore(score, name) {
  const highScores = await loadHighScores();
  highScores.push({ name, score, date: new Date().toISOString() });
  highScores.sort((a, b) => b.score - a.score); // Sort by score descending
  highScores.splice(5); // Keep only top 5 scores
  await fs.writeFile(HIGHSCORE_FILE, JSON.stringify(highScores, null, 2));
}

// Display high scores
async function showHighScores() {
  const highScores = await loadHighScores();
  if (!highScores.length) {
    console.log(chalk.yellow('No high scores yet.'));
    return;
  }
  console.log(chalk.blue('High Scores:'));
  highScores.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.name} - ${entry.score} points (${entry.date})`);
  });
}

// Reset high scores
async function resetHighScores() {
  await fs.writeFile(HIGHSCORE_FILE, JSON.stringify([], null, 2));
  console.log(chalk.green('High scores cleared!'));
}

// Generate random number between min and max
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Play a game
async function playGame() {
  const targetNumber = getRandomNumber(1, 100);
  let attempts = 0;

  console.log(chalk.cyan('Welcome to the Number Guessing Game!'));
  console.log(chalk.cyan('Guess a number between 1 and 100.'));

  while (true) {
    const { guess } = await inquirer.prompt([
      {
        type: 'input',
        name: 'guess',
        message: 'Enter your guess:',
        validate: input => {
          const num = parseInt(input);
          return !isNaN(num) && num >= 1 && num <= 100 ? true : 'Please enter a number between 1 and 100.';
        },
      },
    ]);

    attempts++;
    const num = parseInt(guess);

    if (num === targetNumber) {
      const score = Math.max(100 - attempts * 5, 10); // Score based on attempts
      console.log(chalk.green(`Congratulations! You guessed ${targetNumber} in ${attempts} attempts!`));
      console.log(chalk.green(`Your score: ${score}`));
      const { name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Enter your name to save your score:',
          default: 'Player',
        },
      ]);
      await saveHighScore(score, name);
      break;
    } else if (num < targetNumber) {
      console.log(chalk.yellow('Your guess is too low! Try again.'));
    } else {
      console.log(chalk.yellow('Your guess is too high! Try again.'));
    }
  }
}

program
  .command('play')
  .description('Start a new game')
  .action(() => playGame());

program
  .command('highscore')
  .description('View high scores')
  .action(() => showHighScores());

program
  .command('reset')
  .description('Clear high scores')
  .action(() => resetHighScores());

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  console.log(chalk.cyan('Use the "play" command to start the game!'));
}
