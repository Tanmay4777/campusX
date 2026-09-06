export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          college: string;
          branch: string;
          year: string;
          target_role: string;
          avatar_url: string;
          level: number;
          xp: number;
          streak: number;
          last_activity_date: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          email?: string;
          college?: string;
          branch?: string;
          year?: string;
          target_role?: string;
          avatar_url?: string;
          level?: number;
          xp?: number;
          streak?: number;
          last_activity_date?: string | null;
          role?: string;
        };
        Update: {
          full_name?: string;
          college?: string;
          branch?: string;
          year?: string;
          target_role?: string;
          avatar_url?: string;
          level?: number;
          xp?: number;
          streak?: number;
          last_activity_date?: string | null;
          role?: string;
        };
      };
      skills: {
        Row: {
          id: string;
          name: string;
          category: string;
          icon_name: string;
          max_level: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          icon_name?: string;
          max_level?: number;
        };
        Update: {
          name?: string;
          category?: string;
          icon_name?: string;
          max_level?: number;
        };
      };
      user_skills: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string;
          proficiency: number;
          xp: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          skill_id: string;
          proficiency?: number;
          xp?: number;
        };
        Update: {
          proficiency?: number;
          xp?: number;
        };
      };
      assessments: {
        Row: {
          id: string;
          skill_id: string;
          title: string;
          description: string;
          max_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          skill_id: string;
          title: string;
          description?: string;
          max_score?: number;
        };
        Update: {
          title?: string;
          description?: string;
          max_score?: number;
        };
      };
      user_assessments: {
        Row: {
          id: string;
          user_id: string;
          assessment_id: string;
          score: number;
          xp_earned: number;
          taken_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          assessment_id: string;
          score?: number;
          xp_earned?: number;
        };
        Update: {
          score?: number;
          xp_earned?: number;
        };
      };
      roadmaps: {
        Row: {
          id: string;
          title: string;
          description: string;
          estimated_weeks: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          estimated_weeks?: number;
        };
        Update: {
          title?: string;
          description?: string;
          estimated_weeks?: number;
        };
      };
      roadmap_phases: {
        Row: {
          id: string;
          roadmap_id: string;
          phase_order: number;
          title: string;
          description: string;
          duration: string;
        };
        Insert: {
          id?: string;
          roadmap_id: string;
          phase_order?: number;
          title: string;
          description?: string;
          duration?: string;
        };
        Update: {
          phase_order?: number;
          title?: string;
          description?: string;
          duration?: string;
        };
      };
      user_roadmap_progress: {
        Row: {
          id: string;
          user_id: string;
          roadmap_id: string;
          current_phase_id: string | null;
          progress_pct: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          roadmap_id: string;
          current_phase_id?: string | null;
          progress_pct?: number;
        };
        Update: {
          current_phase_id?: string | null;
          progress_pct?: number;
        };
      };
      projects: {
        Row: {
          id: string;
          title: string;
          description: string;
          tech_stack: string[];
          difficulty: string;
          estimated_hours: number;
          required_skills: string[];
          xp_reward: number;
          category: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          tech_stack?: string[];
          difficulty?: string;
          estimated_hours?: number;
          required_skills?: string[];
          xp_reward?: number;
          category?: string;
          order_index?: number;
        };
        Update: {
          title?: string;
          description?: string;
          tech_stack?: string[];
          difficulty?: string;
          estimated_hours?: number;
          required_skills?: string[];
          xp_reward?: number;
          category?: string;
          order_index?: number;
        };
      };
      user_projects: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          status: string;
          progress_pct: number;
          rating: number;
          github_url: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          project_id: string;
          status?: string;
          progress_pct?: number;
          rating?: number;
          github_url?: string;
        };
        Update: {
          status?: string;
          progress_pct?: number;
          rating?: number;
          github_url?: string;
        };
      };
      user_activity: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          title: string;
          description: string;
          xp: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          activity_type: string;
          title: string;
          description?: string;
          xp?: number;
        };
        Update: {
          activity_type?: string;
          title?: string;
          description?: string;
          xp?: number;
        };
      };
      assessment_questions: {
        Row: {
          id: string;
          assessment_id: string;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_option: string;
          explanation: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_option: string;
          explanation?: string;
          order_index?: number;
        };
        Update: {
          question_text?: string;
          option_a?: string;
          option_b?: string;
          option_c?: string;
          option_d?: string;
          correct_option?: string;
          explanation?: string;
          order_index?: number;
        };
      };
      badges: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          icon_name: string;
          category: string;
          xp_reward: number;
          rarity: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          icon_name?: string;
          category?: string;
          xp_reward?: number;
          rarity?: string;
        };
        Update: {
          name?: string;
          description?: string;
          icon_name?: string;
          category?: string;
          xp_reward?: number;
          rarity?: string;
        };
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          badge_id: string;
        };
        Update: {
          earned_at?: string;
        };
      };
      dsa_practice: {
        Row: {
          id: string;
          user_id: string;
          problem_title: string;
          difficulty: string;
          topic: string;
          xp_earned: number;
          solved_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          problem_title: string;
          difficulty?: string;
          topic?: string;
          xp_earned?: number;
        };
        Update: {
          problem_title?: string;
          difficulty?: string;
          topic?: string;
          xp_earned?: number;
        };
      };
      interviews: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          topic: string;
          score: number;
          duration_minutes: number;
          xp_earned: number;
          conducted_at: string;
          category: string;
          evaluation: InterviewEvaluation;
          transcript: InterviewTranscriptEntry[];
        };
        Insert: {
          id?: string;
          user_id?: string;
          type?: string;
          topic?: string;
          score?: number;
          duration_minutes?: number;
          xp_earned?: number;
          category?: string;
          evaluation?: InterviewEvaluation;
          transcript?: InterviewTranscriptEntry[];
        };
        Update: {
          type?: string;
          topic?: string;
          score?: number;
          duration_minutes?: number;
          xp_earned?: number;
          category?: string;
          evaluation?: InterviewEvaluation;
          transcript?: InterviewTranscriptEntry[];
        };
      };
      interview_questions: {
        Row: {
          id: string;
          category: string;
          difficulty: string;
          question: string;
          tags: string[];
          role_hints: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          difficulty?: string;
          question: string;
          tags?: string[];
          role_hints?: string[];
        };
        Update: {
          category?: string;
          difficulty?: string;
          question?: string;
          tags?: string[];
          role_hints?: string[];
        };
      };
      learning_activities: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          title: string;
          resource_url: string;
          duration_minutes: number;
          xp_earned: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          activity_type: string;
          title: string;
          resource_url?: string;
          duration_minutes?: number;
          xp_earned?: number;
        };
        Update: {
          activity_type?: string;
          title?: string;
          resource_url?: string;
          duration_minutes?: number;
          xp_earned?: number;
        };
      };
      streak_log: {
        Row: {
          id: string;
          user_id: string;
          activity_date: string;
          xp_earned: number;
        };
        Insert: {
          id?: string;
          user_id?: string;
          activity_date?: string;
          xp_earned?: number;
        };
        Update: {
          xp_earned?: number;
        };
      };
      career_roadmaps: {
        Row: {
          id: string;
          role: string;
          title: string;
          description: string;
          icon_name: string;
          estimated_weeks: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          role: string;
          title: string;
          description: string;
          icon_name?: string;
          estimated_weeks?: number;
        };
        Update: {
          title?: string;
          description?: string;
          icon_name?: string;
          estimated_weeks?: number;
        };
      };
      roadmap_milestones: {
        Row: {
          id: string;
          roadmap_id: string;
          phase: string;
          order_index: number;
          title: string;
          description: string;
          skill: string;
          topics: string[];
          estimated_hours: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          roadmap_id: string;
          phase?: string;
          order_index?: number;
          title: string;
          description?: string;
          skill?: string;
          topics?: string[];
          estimated_hours?: number;
        };
        Update: {
          phase?: string;
          order_index?: number;
          title?: string;
          description?: string;
          skill?: string;
          topics?: string[];
          estimated_hours?: number;
        };
      };
      user_roadmap_milestones: {
        Row: {
          id: string;
          user_id: string;
          milestone_id: string;
          status: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          milestone_id: string;
          status?: string;
          completed_at?: string | null;
        };
        Update: {
          status?: string;
          completed_at?: string | null;
        };
      };
      learning_topics: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          skill: string;
          track: string;
          difficulty: string;
          order_index: number;
          estimated_minutes: number;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string;
          skill: string;
          track?: string;
          difficulty?: string;
          order_index?: number;
          estimated_minutes?: number;
          tags?: string[];
        };
        Update: {
          title?: string;
          description?: string;
          skill?: string;
          track?: string;
          difficulty?: string;
          order_index?: number;
          estimated_minutes?: number;
          tags?: string[];
        };
      };
      learning_resources: {
        Row: {
          id: string;
          topic_id: string;
          title: string;
          description: string;
          resource_type: string;
          url: string;
          duration_minutes: number;
          source: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          title: string;
          description?: string;
          resource_type?: string;
          url: string;
          duration_minutes?: number;
          source?: string;
          order_index?: number;
        };
        Update: {
          title?: string;
          description?: string;
          resource_type?: string;
          url?: string;
          duration_minutes?: number;
          source?: string;
          order_index?: number;
        };
      };
      user_learning_progress: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          status: string;
          completed_at: string | null;
          xp_earned: number;
        };
        Insert: {
          id?: string;
          user_id?: string;
          topic_id: string;
          status?: string;
          completed_at?: string | null;
          xp_earned?: number;
        };
        Update: {
          status?: string;
          completed_at?: string | null;
          xp_earned?: number;
        };
      };
      project_verifications: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          repo_url: string;
          repo_name: string;
          repo_full_name: string;
          description: string;
          stars: number;
          forks: number;
          open_issues: number;
          languages: Record<string, number>;
          has_readme: boolean;
          has_tests: boolean;
          has_docker: boolean;
          has_ci: boolean;
          source_file_count: number;
          license: string;
          quality_score: number;
          suggestions: { category: string; message: string; severity: 'high' | 'medium' | 'low' }[];
          analyzed_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          project_id: string;
          repo_url?: string;
          repo_name?: string;
          repo_full_name?: string;
          description?: string;
          stars?: number;
          forks?: number;
          open_issues?: number;
          languages?: Record<string, number>;
          has_readme?: boolean;
          has_tests?: boolean;
          has_docker?: boolean;
          has_ci?: boolean;
          source_file_count?: number;
          license?: string;
          quality_score?: number;
          suggestions?: { category: string; message: string; severity: 'high' | 'medium' | 'low' }[];
        };
        Update: {
          repo_url?: string;
          repo_name?: string;
          repo_full_name?: string;
          description?: string;
          stars?: number;
          forks?: number;
          open_issues?: number;
          languages?: Record<string, number>;
          has_readme?: boolean;
          has_tests?: boolean;
          has_docker?: boolean;
          has_ci?: boolean;
          source_file_count?: number;
          license?: string;
          quality_score?: number;
          suggestions?: { category: string; message: string; severity: 'high' | 'medium' | 'low' }[];
        };
      };
      target_role_skills: {
        Row: {
          id: string;
          role: string;
          required_skills: string[];
          preferred_skills: string[];
          min_projects: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          role: string;
          required_skills?: string[];
          preferred_skills?: string[];
          min_projects?: number;
        };
        Update: {
          role?: string;
          required_skills?: string[];
          preferred_skills?: string[];
          min_projects?: number;
        };
      };
      resume_analyses: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          target_role: string;
          extracted_text: string;
          extracted_skills: string[];
          missing_skills: string[];
          project_quality_score: number;
          completeness_score: number;
          match_score: number;
          suggestions: { category: string; message: string; severity: 'high' | 'medium' | 'low' }[];
          analyzed_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          file_name?: string;
          target_role?: string;
          extracted_text?: string;
          extracted_skills?: string[];
          missing_skills?: string[];
          project_quality_score?: number;
          completeness_score?: number;
          match_score?: number;
          suggestions?: { category: string; message: string; severity: 'high' | 'medium' | 'low' }[];
        };
        Update: {
          file_name?: string;
          target_role?: string;
          extracted_text?: string;
          extracted_skills?: string[];
          missing_skills?: string[];
          project_quality_score?: number;
          completeness_score?: number;
          match_score?: number;
          suggestions?: { category: string; message: string; severity: 'high' | 'medium' | 'low' }[];
        };
      };
      community_posts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          category: string;
          tags: string[];
          like_count: number;
          reply_count: number;
          pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          content?: string;
          category?: string;
          tags?: string[];
          like_count?: number;
          reply_count?: number;
          pinned?: boolean;
        };
        Update: {
          title?: string;
          content?: string;
          category?: string;
          tags?: string[];
          like_count?: number;
          reply_count?: number;
          pinned?: boolean;
        };
      };
      post_replies: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          like_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id?: string;
          content: string;
          like_count?: number;
        };
        Update: {
          content?: string;
          like_count?: number;
        };
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id?: string;
        };
        Update: {};
      };
      mentor_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          bio: string;
          company: string;
          role: string;
          skills: string[];
          specializations: string[];
          experience_years: number;
          linkedin_url: string;
          is_available: boolean;
          max_mentees: number;
          current_mentees: number;
          rating: number;
          total_reviews: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          full_name?: string;
          bio?: string;
          company?: string;
          role?: string;
          skills?: string[];
          specializations?: string[];
          experience_years?: number;
          linkedin_url?: string;
          is_available?: boolean;
          max_mentees?: number;
          current_mentees?: number;
          rating?: number;
          total_reviews?: number;
        };
        Update: {
          full_name?: string;
          bio?: string;
          company?: string;
          role?: string;
          skills?: string[];
          specializations?: string[];
          experience_years?: number;
          linkedin_url?: string;
          is_available?: boolean;
          max_mentees?: number;
          current_mentees?: number;
          rating?: number;
          total_reviews?: number;
        };
      };
      mentorship_requests: {
        Row: {
          id: string;
          mentor_id: string;
          student_id: string;
          status: string;
          message: string;
          goals: string;
          rejected_reason: string;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          mentor_id: string;
          student_id?: string;
          status?: string;
          message?: string;
          goals?: string;
          rejected_reason?: string;
          responded_at?: string | null;
        };
        Update: {
          status?: string;
          message?: string;
          goals?: string;
          rejected_reason?: string;
          responded_at?: string | null;
        };
      };
      jobs: {
        Row: {
          id: string;
          posted_by: string;
          company: string;
          title: string;
          description: string;
          location: string;
          job_type: string;
          role: string;
          required_skills: string[];
          preferred_skills: string[];
          min_cgpa: number;
          eligible_years: string[];
          eligible_branches: string[];
          package_lpa: number;
          deadline: string;
          is_active: boolean;
          application_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          posted_by?: string;
          company: string;
          title: string;
          description?: string;
          location?: string;
          job_type?: string;
          role?: string;
          required_skills?: string[];
          preferred_skills?: string[];
          min_cgpa?: number;
          eligible_years?: string[];
          eligible_branches?: string[];
          package_lpa?: number;
          deadline?: string;
          is_active?: boolean;
          application_count?: number;
        };
        Update: {
          company?: string;
          title?: string;
          description?: string;
          location?: string;
          job_type?: string;
          role?: string;
          required_skills?: string[];
          preferred_skills?: string[];
          min_cgpa?: number;
          eligible_years?: string[];
          eligible_branches?: string[];
          package_lpa?: number;
          deadline?: string;
          is_active?: boolean;
          application_count?: number;
        };
      };
      saved_jobs: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          job_id: string;
        };
        Update: {};
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          user_id: string;
          status: string;
          cover_letter: string;
          resume_url: string;
          applied_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          user_id?: string;
          status?: string;
          cover_letter?: string;
          resume_url?: string;
        };
        Update: {
          status?: string;
          cover_letter?: string;
          resume_url?: string;
        };
      };
      placement_announcements: {
        Row: {
          id: string;
          posted_by: string;
          title: string;
          content: string;
          type: string;
          priority: string;
          is_pinned: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          posted_by?: string;
          title: string;
          content?: string;
          type?: string;
          priority?: string;
          is_pinned?: boolean;
        };
        Update: {
          title?: string;
          content?: string;
          type?: string;
          priority?: string;
          is_pinned?: boolean;
        };
      };
      placement_assessments: {
        Row: {
          id: string;
          job_id: string | null;
          posted_by: string;
          title: string;
          description: string;
          test_type: string;
          duration_minutes: number;
          deadline: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id?: string | null;
          posted_by?: string;
          title: string;
          description?: string;
          test_type?: string;
          duration_minutes?: number;
          deadline?: string;
          is_active?: boolean;
        };
        Update: {
          title?: string;
          description?: string;
          test_type?: string;
          duration_minutes?: number;
          deadline?: string;
          is_active?: boolean;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          link: string;
          metadata: Record<string, unknown>;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          type?: string;
          title: string;
          message?: string;
          link?: string;
          metadata?: Record<string, unknown>;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
          type?: string;
          title?: string;
          message?: string;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          email_notifications: boolean;
          push_notifications: boolean;
          job_alerts: boolean;
          announcement_alerts: boolean;
          interview_reminders: boolean;
          achievement_notifications: boolean;
          mentorship_updates: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          email_notifications?: boolean;
          push_notifications?: boolean;
          job_alerts?: boolean;
          announcement_alerts?: boolean;
          interview_reminders?: boolean;
          achievement_notifications?: boolean;
          mentorship_updates?: boolean;
        };
        Update: {
          email_notifications?: boolean;
          push_notifications?: boolean;
          job_alerts?: boolean;
          announcement_alerts?: boolean;
          interview_reminders?: boolean;
          achievement_notifications?: boolean;
          mentorship_updates?: boolean;
        };
      };
    };
  };
}

export interface InterviewEvaluation {
  technical_depth: number;
  relevance: number;
  clarity: number;
  communication: number;
  overall: number;
  answers: { question: string; answer: string; feedback: string; score: number }[];
}

export interface InterviewTranscriptEntry {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: string;
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type Badge = Database['public']['Tables']['badges']['Row'];
export type UserBadge = Database['public']['Tables']['user_badges']['Row'];
export type UserActivity = Database['public']['Tables']['user_activity']['Row'];
export type DsaPractice = Database['public']['Tables']['dsa_practice']['Row'];
export type Interview = Database['public']['Tables']['interviews']['Row'];
export type LearningActivity = Database['public']['Tables']['learning_activities']['Row'];
export type StreakLog = Database['public']['Tables']['streak_log']['Row'];
export type CareerRoadmap = Database['public']['Tables']['career_roadmaps']['Row'];
export type RoadmapMilestone = Database['public']['Tables']['roadmap_milestones']['Row'];
export type UserRoadmapMilestone = Database['public']['Tables']['user_roadmap_milestones']['Row'];
export type LearningTopic = Database['public']['Tables']['learning_topics']['Row'];
export type LearningResource = Database['public']['Tables']['learning_resources']['Row'];
export type UserLearningProgress = Database['public']['Tables']['user_learning_progress']['Row'];
export type ProjectVerification = Database['public']['Tables']['project_verifications']['Row'];
export type TargetRoleSkills = Database['public']['Tables']['target_role_skills']['Row'];
export type ResumeAnalysis = Database['public']['Tables']['resume_analyses']['Row'];
export type InterviewQuestion = Database['public']['Tables']['interview_questions']['Row'];
export type CommunityPost = Database['public']['Tables']['community_posts']['Row'];
export type PostReply = Database['public']['Tables']['post_replies']['Row'];
export type PostLike = Database['public']['Tables']['post_likes']['Row'];
export type MentorProfile = Database['public']['Tables']['mentor_profiles']['Row'];
export type MentorshipRequest = Database['public']['Tables']['mentorship_requests']['Row'];
export type Job = Database['public']['Tables']['jobs']['Row'];
export type SavedJob = Database['public']['Tables']['saved_jobs']['Row'];
export type JobApplication = Database['public']['Tables']['job_applications']['Row'];
export type PlacementAnnouncement = Database['public']['Tables']['placement_announcements']['Row'];
export type PlacementAssessment = Database['public']['Tables']['placement_assessments']['Row'];
export type UserRole = 'student' | 'mentor' | 'admin';
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationPreference = Database['public']['Tables']['notification_preferences']['Row'];
