# Quiz and Paper Authoring Guide

## Introduction

This guide is for content creators who want to write quizzes and exam papers using Quizzy. Whether you're an educator, trainer, or content developer, this guide will help you create effective and well-structured assessment materials.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Questions](#creating-questions)
3. [Creating Quiz Papers](#creating-quiz-papers)
4. [Organizing with Tags and Categories](#organizing-with-tags-and-categories)
5. [Using Markdown](#using-markdown)
6. [Best Practices](#best-practices)
7. [Import and Export](#import-and-export)
8. [Advanced Features](#advanced-features)

## Getting Started

### Accessing the Editor

1. Open Quizzy in your browser
2. Navigate to the Edit section from the main menu
3. Choose "Questions" to create individual questions or "Papers" to create quiz papers

### Understanding the Workflow

```
Create Questions → Organize with Tags → Build Papers → Test → Publish
```

## Creating Questions

Quizzy supports three types of questions:

### 1. Multiple Choice Questions

**Use Cases:**
- Knowledge recall
- Concept understanding
- Process evaluation
- Best practices assessment

**Structure:**
```
Question Content: [Your question text in Markdown]

Options:
□ Option A
□ Option B
☑ Option C (Correct)
□ Option D
```

**Fields:**
- **Name/Serial**: Optional reference identifier (e.g., "Q001", "MATH-101")
- **Title**: Optional short title for the question
- **Content**: The main question text (supports Markdown)
- **Options**: List of choices
  - Mark correct options with the checkbox
  - Support multiple correct answers
- **Solution**: Optional explanation of the answer
- **Tags**: Knowledge points covered (e.g., "algebra", "quadratic equations")
- **Categories**: Course/syllabus categories (e.g., "Mathematics", "Chapter 3")

**Example:**
```markdown
**Name**: MATH-001

**Content**: 
What is the solution to the equation x² - 5x + 6 = 0?

**Options**:
- ☐ x = 1, x = 6
- ☑ x = 2, x = 3
- ☐ x = -2, x = -3
- ☐ x = 0, x = 5

**Solution**:
Factor the equation: (x - 2)(x - 3) = 0
Therefore, x = 2 or x = 3

**Tags**: algebra, quadratic-equations, factoring
**Categories**: Mathematics, Chapter 5
```

**Tips:**
- Keep options similar in length and complexity
- Avoid "all of the above" or "none of the above" options
- Ensure only one clearly correct answer (unless multiple choice is intended)
- Use distractors that represent common misconceptions

### 2. Fill-in-the-Blank Questions

**Use Cases:**
- Testing specific terminology
- Code completion
- Formula recall
- Precise knowledge testing

**Structure:**
Questions use special markers for blanks: `[[@blank: key]]`

**Fields:**
- All fields from multiple choice questions
- **Blanks**: List of blank definitions
  - **Key**: Identifier matching the marker in content
  - **Answer**: Expected answer text
  - **Use RegExp**: Enable regular expression matching
  - **RegExp Flags**: Flags for regex (e.g., "i" for case-insensitive)

**Example 1: Simple Text Blanks**
```markdown
**Content**:
The capital of France is [[@blank: capital]].

**Blanks**:
- Key: capital
  Answer: Paris
  RegExp: No
```

**Example 2: Using Regular Expressions**
```markdown
**Content**:
In Python, the keyword [[@blank: def]] is used to define a function, 
and [[@blank: return]] is used to return a value.

**Blanks**:
- Key: def
  Answer: def
  RegExp: No

- Key: return
  Answer: return|returns
  RegExp: Yes
  Flags: i
```

**Example 3: Multiple Acceptable Answers**
```markdown
**Content**:
The HTTP status code [[@blank: success]] indicates a successful request.

**Blanks**:
- Key: success
  Answer: ^(200|2\d{2})$
  RegExp: Yes
  Flags: (empty)
```

**Tips:**
- Use clear, unambiguous blanks
- Provide hints if the blank is difficult
- Use regex for flexible matching (e.g., "color|colour")
- Test regex patterns before deploying
- Consider case sensitivity carefully

### 3. Free-Text Questions

**Use Cases:**
- Essay questions
- Code writing exercises
- Problem-solving
- Open-ended responses
- Critical thinking

**Fields:**
- All standard fields
- **Reference Answer**: Example or model answer (not checked automatically)

**Example:**
```markdown
**Content**:
Explain the concept of polymorphism in object-oriented programming 
with a real-world example. (200-300 words)

**Reference Answer**:
Polymorphism is a core concept in OOP that allows objects of different 
classes to be treated as objects of a common base class. It enables 
the same interface to be used for different underlying forms (data types).

Example: A drawing application with various shapes (Circle, Rectangle, 
Triangle). Each shape class implements a draw() method, but the 
implementation differs. The application can call draw() on any shape 
without knowing its specific type.

Benefits:
- Code reusability
- Flexibility and extensibility
- Simplified code maintenance

**Tags**: OOP, polymorphism, software-design
**Categories**: Computer Science, Programming Concepts
```

**Tips:**
- Provide clear rubrics or criteria for evaluation
- Specify word count or format requirements
- Include a reference answer for graders
- Consider breaking complex questions into parts

## Creating Quiz Papers

A quiz paper is a collection of questions organized for assessment.

### Paper Structure

**Fields:**
- **Name**: Display name for the quiz
- **Description**: Overview of the quiz content and objectives
- **Cover Image**: Optional image URL
- **Questions**: Ordered list of question IDs
- **Tags**: Overall knowledge points covered
- **Categories**: Course/syllabus classification
- **Weights**: Optional scoring weights per question
- **Duration**: Time limit in minutes (optional)

### Creating a Paper

#### Method 1: From Scratch

1. Go to Edit → Papers → New Paper
2. Fill in basic information
3. Click "Add Questions"
4. Search or browse for questions
5. Select and add questions to paper
6. Rearrange question order via drag-and-drop
7. Set question weights if needed
8. Save the paper

#### Method 2: Import Complete Paper

Use JSON format with embedded questions (see Import/Export section).

### Organizing Questions in Papers

**Linear Flow:**
```
Question 1 → Question 2 → Question 3 → ... → Submit
```

**Considerations:**
- Order questions from easy to hard (warm-up approach)
- Group questions by topic
- Mix question types for variety
- Consider cognitive load
- Place key questions strategically

### Setting Question Weights

By default, all questions have equal weight. You can customize weights:

**Example:**
```
Question 1: Weight 1.0 (10 points)
Question 2: Weight 2.0 (20 points)
Question 3: Weight 1.5 (15 points)
Total: 45 points
```

**Use Cases:**
- Emphasize important concepts
- Reward difficult questions
- Balance different question types
- Match grading rubrics

### Time Limits

Set duration in minutes:
- **No limit**: Students can take unlimited time
- **Timed**: Strict time limit, auto-submit when time expires
- **Recommended time**: Show time but don't enforce

## Organizing with Tags and Categories

### Tags vs. Categories

**Tags:**
- Fine-grained knowledge points
- Multiple tags per question
- Used for micro-organization
- Example: "inheritance", "encapsulation", "abstraction"

**Categories:**
- Broad classification
- Course or syllabus structure
- Used for macro-organization
- Example: "Object-Oriented Programming", "Chapter 4"

### Tag Best Practices

**Consistency:**
- Use lowercase for tags
- Use hyphens for multi-word tags: "machine-learning"
- Create a tag vocabulary for your organization

**Specificity:**
```
❌ Too broad: "math"
✓ Good: "linear-algebra", "calculus", "probability"

❌ Too narrow: "question-5-problem-a"
✓ Good: "hypothesis-testing", "chi-square-test"
```

**Coverage:**
- Add 2-5 tags per question
- Include both specific and general tags
- Tag relationships should form a hierarchy

**Example Hierarchy:**
```
programming
├── python
│   ├── python-basics
│   ├── python-oop
│   └── python-data-structures
└── javascript
    ├── js-fundamentals
    └── js-async
```

### Category Best Practices

**Structure:**
- Mirror your curriculum or course structure
- Use consistent naming
- Keep hierarchy shallow (2-3 levels)

**Example:**
```
Computer Science
├── Programming Fundamentals
├── Data Structures
├── Algorithms
└── Software Engineering

Mathematics
├── Algebra
├── Calculus
├── Statistics
└── Discrete Mathematics
```

### Tag Management

**Current System:**
Tags are stored as text strings. While a new tag entity system exists, it's not yet fully integrated with questions and papers.

**Workflow:**
1. Define your tag vocabulary first
2. Use consistent tag names
3. Periodically review and standardize tags
4. Merge duplicate or similar tags manually

**Future System:**
A centralized tag management system is planned that will:
- Use tag IDs instead of strings
- Enable tag renaming without breaking references
- Support tag hierarchies
- Provide tag merge and split operations
- Show tag usage statistics

## Using Markdown

Quizzy supports Markdown formatting in most text fields.

### Basic Syntax

**Text Formatting:**
```markdown
**Bold text**
*Italic text*
***Bold and italic***
~~Strikethrough~~
`Inline code`
```

**Headings:**
```markdown
# Heading 1
## Heading 2
### Heading 3
```

**Lists:**
```markdown
Unordered:
- Item 1
- Item 2
  - Nested item

Ordered:
1. First item
2. Second item
3. Third item
```

**Links:**
```markdown
[Link text](https://example.com)
[Link with title](https://example.com "Title")
```

**Images:**
```markdown
![Alt text](image-url.jpg)
![Alt text with title](image-url.jpg "Image title")
```

**Code Blocks:**
````markdown
```python
def hello_world():
    print("Hello, World!")
```

```javascript
function helloWorld() {
  console.log("Hello, World!");
}
```
````

**Tables:**
```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

**Blockquotes:**
```markdown
> This is a quote
> It can span multiple lines
```

**Horizontal Rules:**
```markdown
---
or
***
```

### Mathematical Expressions

For mathematical content, use standard mathematical notation or consider using Unicode characters:

```markdown
**Basic:**
x² + y² = z²
∫ f(x)dx
∑ (n=1 to ∞)
√(x)
π ≈ 3.14159

**Fractions:**
1/2, 3/4, (a+b)/c

**Greek Letters:**
α, β, γ, δ, θ, λ, π, σ, Φ, Ω
```

**Note:** Full LaTeX support may be added in the future.

### Best Practices for Markdown

1. **Preview your content** before saving
2. **Keep it simple** - don't over-format
3. **Use code blocks** for code and technical content
4. **Structure with headings** for long content
5. **Separate paragraphs** with blank lines
6. **Use lists** for enumerated items
7. **Add alt text** to images for accessibility

## Best Practices

### Question Quality

**Clarity:**
- Use clear, unambiguous language
- Avoid double negatives
- Define technical terms
- Provide context if needed

**Difficulty:**
- Match difficulty to learning objectives
- Provide a range of difficulty levels
- Use Bloom's Taxonomy as a guide:
  - Remember → Understand → Apply → Analyze → Evaluate → Create

**Fairness:**
- Avoid trick questions
- Don't test trivial details
- Ensure questions can be answered within time limits
- Avoid cultural or regional bias

**Feedback:**
- Provide detailed solutions
- Explain why wrong answers are incorrect
- Include references for further learning
- Use solutions as teaching moments

### Quiz Paper Design

**Balance:**
- Mix question types
- Cover all important topics
- Vary difficulty levels
- Include foundational and advanced questions

**Length:**
- Consider cognitive load
- Allow sufficient time per question
- Typical guidelines:
  - Multiple choice: 1-2 minutes
  - Fill-in-blank: 2-3 minutes
  - Free-text: 5-15 minutes (depending on complexity)

**Flow:**
- Start with easier questions to build confidence
- Group related questions together
- Place difficult questions in the middle
- End with moderate difficulty

**Instructions:**
- Provide clear instructions in the description
- Explain scoring system
- State time limits clearly
- Include any special requirements

### Accessibility

**Visual:**
- Use descriptive alt text for images
- Don't rely solely on color coding
- Ensure sufficient contrast
- Use clear fonts and adequate sizing

**Cognitive:**
- Use plain language
- Break complex questions into parts
- Provide examples when needed
- Allow adequate time

**Technical:**
- Test on different devices
- Ensure compatibility
- Provide alternative formats if needed

## Import and Export

### Export Formats

Quizzy supports JSON export for backup and sharing.

**Export Options:**
1. Export individual questions
2. Export quiz papers
3. Export complete papers (with embedded questions)
4. Export full database

**To Export:**
1. Navigate to Settings
2. Select "Export Data"
3. Choose what to export
4. Download JSON file

### Import Formats

**Individual Question Import:**
```json
{
  "id": "optional-id",
  "type": "choice",
  "name": "Q001",
  "content": "What is 2 + 2?",
  "options": [
    { "content": "3", "shouldChoose": false },
    { "content": "4", "shouldChoose": true },
    { "content": "5", "shouldChoose": false }
  ],
  "tags": ["math", "arithmetic"],
  "categories": ["Mathematics", "Basic Operations"],
  "solution": "2 + 2 equals 4"
}
```

**Blank Question Import:**
```json
{
  "type": "blank",
  "content": "The capital of [[@blank: country]] is Paris.",
  "blanks": [
    {
      "key": "country",
      "answer": "France",
      "answerIsRegExp": false
    }
  ],
  "tags": ["geography"],
  "categories": ["World Geography"]
}
```

**Quiz Paper Import:**
```json
{
  "name": "Sample Quiz",
  "desc": "A sample quiz on basic mathematics",
  "questions": ["question-id-1", "question-id-2"],
  "duration": 3600000,
  "tags": ["math"],
  "categories": ["Mathematics"]
}
```

**Complete Paper Import (with embedded questions):**
```json
{
  "name": "Complete Sample Quiz",
  "desc": "Quiz with embedded questions",
  "questions": [
    {
      "type": "choice",
      "content": "What is 2 + 2?",
      "options": [
        { "content": "4", "shouldChoose": true }
      ]
    },
    {
      "type": "text",
      "content": "Explain the Pythagorean theorem.",
      "answer": "Reference answer here..."
    }
  ],
  "tags": ["math"],
  "categories": ["Mathematics"]
}
```

**To Import:**
1. Prepare your JSON file
2. Navigate to Settings
3. Select "Import Data"
4. Choose your file
5. Review conflicts if any
6. Confirm import

### Bulk Operations

**Creating Multiple Questions:**
1. Prepare JSON array with all questions
2. Import using "Import Questions" option
3. Review imported questions
4. Fix any errors

**Updating Questions:**
- Export existing questions
- Modify JSON file
- Re-import (system will detect conflicts)
- Choose to overwrite or keep existing

## Advanced Features

### Bookmarks

Use bookmarks to organize questions during authoring:

**Bookmark Types:**
- **Default**: General bookmarks
- **Reported**: Mark questions with issues
- **Custom**: Create your own bookmark types

**Workflow:**
1. Review questions
2. Bookmark questions needing revision
3. Filter by bookmark type
4. Update and remove bookmarks

### Random Quizzes

Create dynamic quizzes that select random questions:

**By Tags:**
- Specify tags and weights
- System selects questions with those tags
- Different questions each time

**By Categories:**
- Specify categories and weights
- Random selection from category
- Ensure coverage of topics

**By Papers:**
- Select multiple papers with weights
- Random questions from selected papers
- Mixed content quizzes

### Statistics and Analytics

After students complete quizzes, review statistics:

**Per Question:**
- Success rate
- Average time
- Common mistakes
- Difficulty rating

**Per Tag/Category:**
- Topic mastery
- Weak areas
- Learning progression

**Use statistics to:**
- Identify problematic questions
- Adjust difficulty
- Improve content
- Track learning outcomes

### Version Control

Quizzy includes basic version control:

**Features:**
- Track question changes
- Revert to previous versions
- Resolve conflicts during import
- Maintain history

**Best Practices:**
- Export regularly for backups
- Document major changes
- Use version comments (in notes)
- Test after major updates

### Collaboration

**Current System:**
- Export your questions/papers as JSON
- Share files with collaborators
- Import their contributions
- Resolve conflicts manually

**Future Enhancements:**
- Cloud synchronization
- Real-time collaboration
- Comment and review system
- Change tracking

## Troubleshooting

### Common Issues

**Question Not Appearing in Paper:**
- Check if question is deleted
- Verify question ID is correct
- Refresh the page
- Clear browser cache

**Search Not Finding Questions:**
- Rebuild search index (Settings → Refresh Search)
- Check tag/category spelling
- Use different search terms
- Search by question content

**Import Errors:**
- Validate JSON syntax
- Check field types match expected values
- Ensure IDs are unique
- Review error messages

**Performance Issues:**
- Limit search results
- Use pagination
- Clear old quiz records
- Export and reimport data

### Getting Help

**Resources:**
- Check the Architecture documentation for technical details
- Review example questions and papers
- Search existing issues
- Contact support/maintainers

## Appendix

### Question Type Selection Guide

| Question Type | Best For | Grading | Feedback |
|--------------|----------|---------|----------|
| Multiple Choice | Concepts, facts, processes | Automatic | Immediate |
| Fill-in-Blank | Terminology, code, formulas | Automatic | Immediate |
| Free-Text | Essays, explanations, problem-solving | Manual | Delayed |

### Recommended Question Counts

| Quiz Duration | Questions | Mix |
|---------------|-----------|-----|
| 5-10 min | 5-10 | All multiple choice |
| 15-30 min | 10-20 | Mixed types |
| 45-60 min | 20-40 | Mixed, some free-text |
| 90+ min | 40+ | Comprehensive coverage |

### Tag Naming Conventions

| ✓ Good | ✗ Avoid |
|--------|---------|
| machine-learning | Machine Learning |
| http-protocol | HTTP |
| oop-inheritance | OOP - Inheritance |
| python-3 | Python 3.x |
| sql-joins | SQL (Joins) |

### Sample Question Templates

See the repository's example files for complete question and paper templates you can use as starting points.

---

**Version:** 1.0  
**Last Updated:** 2025  
**Maintainers:** Quizzy Development Team
