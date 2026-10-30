"use client"

import { useParams } from "next/navigation"
import QuizStudio from "@/components/lms/studio/QuizStudio"

export default function EvaluacionInstructorPage() {
  const { id, quizId } = useParams<{ id: string; quizId: string }>()
  return <QuizStudio courseId={id} quizId={quizId} />
}
