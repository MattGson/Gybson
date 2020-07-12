import * as dbt from './db-schema';
export interface DBTables {
    ac_ratios: dbt.ac_ratios;
    age_ranges: dbt.age_ranges;
    athlete_profiles: dbt.athlete_profiles;
    athlete_testing_benchmarks: dbt.athlete_testing_benchmarks;
    block_week_workouts: dbt.block_week_workouts;
    common_statistics: dbt.common_statistics;
    computed_wellness: dbt.computed_wellness;
    compute_control: dbt.compute_control;
    data_points: dbt.data_points;
    default_metric_ac_ratios: dbt.default_metric_ac_ratios;
    default_workload_metrics: dbt.default_workload_metrics;
    exercises: dbt.exercises;
    exercise_categories: dbt.exercise_categories;
    exercise_category_members: dbt.exercise_category_members;
    exercise_category_translations: dbt.exercise_category_translations;
    exercise_data_points: dbt.exercise_data_points;
    exercise_preferred_units: dbt.exercise_preferred_units;
    exercise_translations: dbt.exercise_translations;
    features: dbt.features;
    feature_sets: dbt.feature_sets;
    feedback: dbt.feedback;
    fitness_components: dbt.fitness_components;
    fitness_component_translations: dbt.fitness_component_translations;
    injuries: dbt.injuries;
    insights: dbt.insights;
    invites: dbt.invites;
    invite_team_members: dbt.invite_team_members;
    knex_data_migrations: dbt.knex_data_migrations;
    knex_data_migrations_lock: dbt.knex_data_migrations_lock;
    knex_migrations: dbt.knex_migrations;
    knex_migrations_lock: dbt.knex_migrations_lock;
    languages: dbt.languages;
    metrics: dbt.metrics;
    organisations: dbt.organisations;
    organisation_features: dbt.organisation_features;
    organisation_members: dbt.organisation_members;
    plans: dbt.plans;
    plan_block_weeks: dbt.plan_block_weeks;
    plan_block_week_fitness_components: dbt.plan_block_week_fitness_components;
    plan_progresses: dbt.plan_progresses;
    plan_sports: dbt.plan_sports;
    plan_user_roles: dbt.plan_user_roles;
    platforms: dbt.platforms;
    platform_versions: dbt.platform_versions;
    posts: dbt.posts;
    post_attachments: dbt.post_attachments;
    post_messages: dbt.post_messages;
    post_replies: dbt.post_replies;
    post_reply_messages: dbt.post_reply_messages;
    proficiencies: dbt.proficiencies;
    proficiency_translations: dbt.proficiency_translations;
    recommendations: dbt.recommendations;
    recommendations_assigned: dbt.recommendations_assigned;
    recommendation_translations: dbt.recommendation_translations;
    recommendation_wellness_metrics: dbt.recommendation_wellness_metrics;
    roles: dbt.roles;
    rpe_responses: dbt.rpe_responses;
    sessions: dbt.sessions;
    sessions_links: dbt.sessions_links;
    session_attachments: dbt.session_attachments;
    session_members: dbt.session_members;
    session_notes: dbt.session_notes;
    sets_reps: dbt.sets_reps;
    sets_reps_schemes: dbt.sets_reps_schemes;
    sports: dbt.sports;
    sport_translations: dbt.sport_translations;
    teams: dbt.teams;
    team_members: dbt.team_members;
    team_member_profiles: dbt.team_member_profiles;
    test_groups: dbt.test_groups;
    test_group_exercises: dbt.test_group_exercises;
    test_group_sessions: dbt.test_group_sessions;
    token: dbt.token;
    units: dbt.units;
    unit_types: dbt.unit_types;
    users: dbt.users;
    wellness_check_ins: dbt.wellness_check_ins;
    wellness_comments: dbt.wellness_comments;
    wellness_metrics: dbt.wellness_metrics;
    wellness_metric_statistics: dbt.wellness_metric_statistics;
    wellness_metric_translations: dbt.wellness_metric_translations;
    wellness_responses: dbt.wellness_responses;
    wellness_schedules: dbt.wellness_schedules;
    wellness_surveys: dbt.wellness_surveys;
    workout_exercises: dbt.workout_exercises;
}
export declare type DBTableName = Extract<keyof DBTables, string>;