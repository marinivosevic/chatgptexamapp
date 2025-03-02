<?php

namespace App\Http\Controllers;

use App\Models\Answers;
use App\Models\Exam;
use App\Models\Question;
use Illuminate\Http\Request;
use App\Models\Course;
use Illuminate\Support\Facades\Log;

class QuestionController extends Controller
{
    public function store(Request $request, Exam $exam)
    {
        $validated = $request->validate([
            'text' => 'required|string',
        ]);

        $question = new Question([
            'text' => $validated['text']
        ]);

        $exam->questions()->save($question);

        return response()->json([
            'message' => 'Question added successfully.',
            'question' => $question
        ], 201);
    }

    public function createExamWithQuestions(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            "start_time" => 'required|string',
            'time' => 'required|integer',
            'date' => 'required|date',
            'access_code' => 'required|string',
            'course_id' => 'required|integer',
            'exam_template_id' => 'required|integer',
        ]);

        $exam = Exam::create([
            'title' => $validated['title'],
            'time' => $validated['time'],
            "start_time" => $validated['start_time'],
            'date' => $validated['date'],
            'access_code' => $validated['access_code'],
            'course_id' => $validated['course_id'],
            'exam_template_id' => $validated['exam_template_id'],
        ]);




        return response()->json([
            'message' => 'Exam and questions added successfully.',
            'exam' => $exam,

        ], 201);
    }

    public function getExamsForCourse($courseId)
    {
        $course = Course::find($courseId);
        if (!$course) {
            return response()->json(['message' => 'Course not found.'], 404);
        }

        // Retrieve exams associated with the course, including related questions
        $exams = $course->exams()->get();

        return response()->json([
            'course' => $course,
            'exams' => $exams,
        ], 200);
    }


    public function saveAnswers(Request $request)
    {
        $validated = $request->validate([
            'exam_session_id' => 'required|integer|exists:exam_sessions,id',
            'question_id' => 'required|integer|exists:questions,id',
            'answer' => 'required|string',
        ]);

        try {
            Log::info('Validated Data:', $validated); // Debugging output

            // Ensure it updates existing answers
            $answer = Answers::updateOrCreate(
                [
                    'exam_session_id' => (int) $validated['exam_session_id'],
                    'question_id' => (int) $validated['question_id'],
                ], // Condition to check for existing record
                [
                    'answer' => $validated['answer'], // Fields to update
                ]
            );

            Log::info('Created/Updated Answer:', $answer->toArray()); // Debugging output

            return response()->json(['message' => 'Answer saved successfully', 'answer' => $answer], 200);
        } catch (\Exception $e) {
            Log::error('Failed to save answer:', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to save answer', 'error' => $e->getMessage()], 500);
        }
    }



    public function getQuestionsForExam($examId)
    {
        $exam = Exam::find($examId);
        if (!$exam) {
            return response()->json(['message' => 'Exam not found.'], 404);
        }

        $questions = $exam->questions;

        return response()->json([
            'exam' => $exam,
            'questions' => $questions,
        ], 200);
    }
}
