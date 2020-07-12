export declare type enum_role = 'OWNER' | 'COLLABORATOR' | 'VIEWER';
export declare type enum_type = 'FEEDBACK' | 'WELLNESS_COMMENT' | 'INJURY';
export declare namespace ac_ratiosFields {
    type metric_id = number;
    type user_id = number;
    type date = Date;
    type ac = number | null;
    type acute = number;
    type chronic_avg = number;
    type target_min = number;
    type target_max = number;
    type percentage = number;
    type deleted = boolean | null;
}
export interface ac_ratios {
    metric_id: ac_ratiosFields.metric_id;
    user_id: ac_ratiosFields.user_id;
    date: ac_ratiosFields.date;
    ac: ac_ratiosFields.ac;
    acute: ac_ratiosFields.acute;
    chronic_avg: ac_ratiosFields.chronic_avg;
    target_min: ac_ratiosFields.target_min;
    target_max: ac_ratiosFields.target_max;
    percentage: ac_ratiosFields.percentage;
    deleted: ac_ratiosFields.deleted;
}
export declare namespace age_rangesFields {
    type age_range_id = number;
    type description = string;
}
export interface age_ranges {
    age_range_id: age_rangesFields.age_range_id;
    description: age_rangesFields.description;
}
export declare namespace athlete_profilesFields {
    type user_id = number;
    type dob = Date;
    type injury_count = number;
    type komodo_scale = number | null;
}
export interface athlete_profiles {
    user_id: athlete_profilesFields.user_id;
    dob: athlete_profilesFields.dob;
    injury_count: athlete_profilesFields.injury_count;
    komodo_scale: athlete_profilesFields.komodo_scale;
}
export declare namespace athlete_testing_benchmarksFields {
    type benchmark_id = number;
    type org_id = number;
    type exercise_id = number;
    type user_id = number;
    type score = number;
    type start_time = Date;
    type end_time = Date | null;
}
export interface athlete_testing_benchmarks {
    benchmark_id: athlete_testing_benchmarksFields.benchmark_id;
    org_id: athlete_testing_benchmarksFields.org_id;
    exercise_id: athlete_testing_benchmarksFields.exercise_id;
    user_id: athlete_testing_benchmarksFields.user_id;
    score: athlete_testing_benchmarksFields.score;
    start_time: athlete_testing_benchmarksFields.start_time;
    end_time: athlete_testing_benchmarksFields.end_time;
}
export declare namespace block_week_workoutsFields {
    type workout_id = number;
    type block_week_id = number;
    type fitness_component_id = number;
    type intensity = number;
    type order = number;
}
export interface block_week_workouts {
    workout_id: block_week_workoutsFields.workout_id;
    block_week_id: block_week_workoutsFields.block_week_id;
    fitness_component_id: block_week_workoutsFields.fitness_component_id;
    intensity: block_week_workoutsFields.intensity;
    order: block_week_workoutsFields.order;
}
export declare namespace common_statisticsFields {
    type stat_id = number;
    type score = number | null;
    type percentage = number | null;
    type acute_z_score = number | null;
    type chronic_z_score = number | null;
    type acute_standard_deviation = number | null;
    type chronic_standard_deviation = number | null;
    type acute_mean = number | null;
    type chronic_mean = number | null;
}
export interface common_statistics {
    stat_id: common_statisticsFields.stat_id;
    score: common_statisticsFields.score;
    percentage: common_statisticsFields.percentage;
    acute_z_score: common_statisticsFields.acute_z_score;
    chronic_z_score: common_statisticsFields.chronic_z_score;
    acute_standard_deviation: common_statisticsFields.acute_standard_deviation;
    chronic_standard_deviation: common_statisticsFields.chronic_standard_deviation;
    acute_mean: common_statisticsFields.acute_mean;
    chronic_mean: common_statisticsFields.chronic_mean;
}
export declare namespace computed_wellnessFields {
    type user_id = number;
    type metric_id = number;
    type date = Date;
    type score = number;
    type percentage = number;
    type description = string | null;
}
export interface computed_wellness {
    user_id: computed_wellnessFields.user_id;
    metric_id: computed_wellnessFields.metric_id;
    date: computed_wellnessFields.date;
    score: computed_wellnessFields.score;
    percentage: computed_wellnessFields.percentage;
    description: computed_wellnessFields.description;
}
export declare namespace compute_controlFields {
    type user_id = number;
    type recalculated_workload = boolean | null;
    type recalculated_wellness = boolean | null;
    type deleted = boolean | null;
}
export interface compute_control {
    user_id: compute_controlFields.user_id;
    recalculated_workload: compute_controlFields.recalculated_workload;
    recalculated_wellness: compute_controlFields.recalculated_wellness;
    deleted: compute_controlFields.deleted;
}
export declare namespace data_pointsFields {
    type session_id = number;
    type user_id = number;
    type team_id = number;
    type metric_id = number;
    type score = number;
}
export interface data_points {
    session_id: data_pointsFields.session_id;
    user_id: data_pointsFields.user_id;
    team_id: data_pointsFields.team_id;
    metric_id: data_pointsFields.metric_id;
    score: data_pointsFields.score;
}
export declare namespace default_metric_ac_ratiosFields {
    type metric_id = number;
    type user_id = number;
    type date = Date;
    type ac = number | null;
    type acute = number;
    type chronic_avg = number;
    type target_min = number;
    type target_max = number;
    type percentage = number;
    type deleted = boolean | null;
}
export interface default_metric_ac_ratios {
    metric_id: default_metric_ac_ratiosFields.metric_id;
    user_id: default_metric_ac_ratiosFields.user_id;
    date: default_metric_ac_ratiosFields.date;
    ac: default_metric_ac_ratiosFields.ac;
    acute: default_metric_ac_ratiosFields.acute;
    chronic_avg: default_metric_ac_ratiosFields.chronic_avg;
    target_min: default_metric_ac_ratiosFields.target_min;
    target_max: default_metric_ac_ratiosFields.target_max;
    percentage: default_metric_ac_ratiosFields.percentage;
    deleted: default_metric_ac_ratiosFields.deleted;
}
export declare namespace default_workload_metricsFields {
    type metric_id = number;
    type name = string;
    type deleted = boolean | null;
}
export interface default_workload_metrics {
    metric_id: default_workload_metricsFields.metric_id;
    name: default_workload_metricsFields.name;
    deleted: default_workload_metricsFields.deleted;
}
export declare namespace exercisesFields {
    type exercise_id = number;
    type unit_id = number;
    type max_score_best = boolean;
    type exercise_pairing_id = number | null;
}
export interface exercises {
    exercise_id: exercisesFields.exercise_id;
    unit_id: exercisesFields.unit_id;
    max_score_best: exercisesFields.max_score_best;
    exercise_pairing_id: exercisesFields.exercise_pairing_id;
}
export declare namespace exercise_categoriesFields {
    type category_id = number;
}
export interface exercise_categories {
    category_id: exercise_categoriesFields.category_id;
}
export declare namespace exercise_category_membersFields {
    type exercise_id = number;
    type category_id = number;
}
export interface exercise_category_members {
    exercise_id: exercise_category_membersFields.exercise_id;
    category_id: exercise_category_membersFields.category_id;
}
export declare namespace exercise_category_translationsFields {
    type category_id = number;
    type language_id = number;
    type description = string;
}
export interface exercise_category_translations {
    category_id: exercise_category_translationsFields.category_id;
    language_id: exercise_category_translationsFields.language_id;
    description: exercise_category_translationsFields.description;
}
export declare namespace exercise_data_pointsFields {
    type exercise_id = number;
    type session_id = number;
    type user_id = number;
    type team_id = number;
    type score = number | null;
}
export interface exercise_data_points {
    exercise_id: exercise_data_pointsFields.exercise_id;
    session_id: exercise_data_pointsFields.session_id;
    user_id: exercise_data_pointsFields.user_id;
    team_id: exercise_data_pointsFields.team_id;
    score: exercise_data_pointsFields.score;
}
export declare namespace exercise_preferred_unitsFields {
    type exercise_id = number;
    type unit_id = number;
    type org_id = number;
}
export interface exercise_preferred_units {
    exercise_id: exercise_preferred_unitsFields.exercise_id;
    unit_id: exercise_preferred_unitsFields.unit_id;
    org_id: exercise_preferred_unitsFields.org_id;
}
export declare namespace exercise_translationsFields {
    type exercise_id = number;
    type language_id = number;
    type title = string;
    type description = string | null;
}
export interface exercise_translations {
    exercise_id: exercise_translationsFields.exercise_id;
    language_id: exercise_translationsFields.language_id;
    title: exercise_translationsFields.title;
    description: exercise_translationsFields.description;
}
export declare namespace featuresFields {
    type feature_id = number;
    type feature_name = string;
}
export interface features {
    feature_id: featuresFields.feature_id;
    feature_name: featuresFields.feature_name;
}
export declare namespace feature_setsFields {
    type feature_set_id = number;
    type feature_set_name = string | null;
    type feature_id = number;
}
export interface feature_sets {
    feature_set_id: feature_setsFields.feature_set_id;
    feature_set_name: feature_setsFields.feature_set_name;
    feature_id: feature_setsFields.feature_id;
}
export declare namespace feedbackFields {
    type post_id = number;
    type user_id = number;
    type session_id = number | null;
    type team_id = number | null;
    type deleted = boolean | null;
}
export interface feedback {
    post_id: feedbackFields.post_id;
    user_id: feedbackFields.user_id;
    session_id: feedbackFields.session_id;
    team_id: feedbackFields.team_id;
    deleted: feedbackFields.deleted;
}
export declare namespace fitness_componentsFields {
    type fitness_component_id = number;
    type default_sets_reps_scheme = number | null;
    type energy_system = string;
    type one_rm_percentage = number;
    type heart_rate_percentage = string;
    type rest_seconds = number;
}
export interface fitness_components {
    fitness_component_id: fitness_componentsFields.fitness_component_id;
    default_sets_reps_scheme: fitness_componentsFields.default_sets_reps_scheme;
    energy_system: fitness_componentsFields.energy_system;
    one_rm_percentage: fitness_componentsFields.one_rm_percentage;
    heart_rate_percentage: fitness_componentsFields.heart_rate_percentage;
    rest_seconds: fitness_componentsFields.rest_seconds;
}
export declare namespace fitness_component_translationsFields {
    type fitness_component_id = number;
    type language_id = number;
    type description = string;
}
export interface fitness_component_translations {
    fitness_component_id: fitness_component_translationsFields.fitness_component_id;
    language_id: fitness_component_translationsFields.language_id;
    description: fitness_component_translationsFields.description;
}
export declare namespace injuriesFields {
    type post_id = number;
    type user_id = number;
    type deleted = boolean | null;
}
export interface injuries {
    post_id: injuriesFields.post_id;
    user_id: injuriesFields.user_id;
    deleted: injuriesFields.deleted;
}
export declare namespace insightsFields {
    type user_id = number;
    type counter = number;
    type datetime = Date;
    type type = string | null;
    type metric = string | null;
    type message = string | null;
    type value = number | null;
    type percentage = number | null;
    type priority = number;
}
export interface insights {
    user_id: insightsFields.user_id;
    counter: insightsFields.counter;
    datetime: insightsFields.datetime;
    type: insightsFields.type;
    metric: insightsFields.metric;
    message: insightsFields.message;
    value: insightsFields.value;
    percentage: insightsFields.percentage;
    priority: insightsFields.priority;
}
export declare namespace invitesFields {
    type invite_id = number;
    type org_id = number;
    type role_id = number;
    type email = string;
    type fname = string;
    type lname = string;
    type token = string;
    type created_at = Date | null;
    type deleted = boolean | null;
}
export interface invites {
    invite_id: invitesFields.invite_id;
    org_id: invitesFields.org_id;
    role_id: invitesFields.role_id;
    email: invitesFields.email;
    fname: invitesFields.fname;
    lname: invitesFields.lname;
    token: invitesFields.token;
    created_at: invitesFields.created_at;
    deleted: invitesFields.deleted;
}
export declare namespace invite_team_membersFields {
    type invite_id = number;
    type team_id = number;
}
export interface invite_team_members {
    invite_id: invite_team_membersFields.invite_id;
    team_id: invite_team_membersFields.team_id;
}
export declare namespace knex_data_migrationsFields {
    type id = number;
    type name = string | null;
    type batch = number | null;
    type migration_time = Date;
}
export interface knex_data_migrations {
    id: knex_data_migrationsFields.id;
    name: knex_data_migrationsFields.name;
    batch: knex_data_migrationsFields.batch;
    migration_time: knex_data_migrationsFields.migration_time;
}
export declare namespace knex_data_migrations_lockFields {
    type index = number;
    type is_locked = number | null;
}
export interface knex_data_migrations_lock {
    index: knex_data_migrations_lockFields.index;
    is_locked: knex_data_migrations_lockFields.is_locked;
}
export declare namespace knex_migrationsFields {
    type id = number;
    type name = string | null;
    type batch = number | null;
    type migration_time = Date;
}
export interface knex_migrations {
    id: knex_migrationsFields.id;
    name: knex_migrationsFields.name;
    batch: knex_migrationsFields.batch;
    migration_time: knex_migrationsFields.migration_time;
}
export declare namespace knex_migrations_lockFields {
    type index = number;
    type is_locked = number | null;
}
export interface knex_migrations_lock {
    index: knex_migrations_lockFields.index;
    is_locked: knex_migrations_lockFields.is_locked;
}
export declare namespace languagesFields {
    type language_id = number;
    type code = string;
    type name = string;
}
export interface languages {
    language_id: languagesFields.language_id;
    code: languagesFields.code;
    name: languagesFields.name;
}
export declare namespace metricsFields {
    type metric_id = number;
    type team_id = number;
    type name = string;
    type unit = string;
    type selected = boolean;
    type deleted = boolean | null;
}
export interface metrics {
    metric_id: metricsFields.metric_id;
    team_id: metricsFields.team_id;
    name: metricsFields.name;
    unit: metricsFields.unit;
    selected: metricsFields.selected;
    deleted: metricsFields.deleted;
}
export declare namespace organisationsFields {
    type org_id = number;
    type name = string;
    type image_uri = string | null;
    type account_limit = number | null;
    type created_at = Date;
    type deleted = boolean | null;
}
export interface organisations {
    org_id: organisationsFields.org_id;
    name: organisationsFields.name;
    image_uri: organisationsFields.image_uri;
    account_limit: organisationsFields.account_limit;
    created_at: organisationsFields.created_at;
    deleted: organisationsFields.deleted;
}
export declare namespace organisation_featuresFields {
    type org_id = number;
    type feature_set_id = number;
}
export interface organisation_features {
    org_id: organisation_featuresFields.org_id;
    feature_set_id: organisation_featuresFields.feature_set_id;
}
export declare namespace organisation_membersFields {
    type org_id = number;
    type user_id = number;
    type role_id = number;
    type created_at = Date;
    type deleted = boolean | null;
}
export interface organisation_members {
    org_id: organisation_membersFields.org_id;
    user_id: organisation_membersFields.user_id;
    role_id: organisation_membersFields.role_id;
    created_at: organisation_membersFields.created_at;
    deleted: organisation_membersFields.deleted;
}
export declare namespace plansFields {
    type plan_id = number;
    type root_plan_id = number | null;
    type name = string;
    type created_at = Date;
    type start_time = Date;
    type age_range_id = number | null;
    type proficiency_id = number | null;
    type deleted = boolean | null;
}
export interface plans {
    plan_id: plansFields.plan_id;
    root_plan_id: plansFields.root_plan_id;
    name: plansFields.name;
    created_at: plansFields.created_at;
    start_time: plansFields.start_time;
    age_range_id: plansFields.age_range_id;
    proficiency_id: plansFields.proficiency_id;
    deleted: plansFields.deleted;
}
export declare namespace plan_block_weeksFields {
    type block_week_id = number;
    type plan_id = number;
    type start_time = Date;
}
export interface plan_block_weeks {
    block_week_id: plan_block_weeksFields.block_week_id;
    plan_id: plan_block_weeksFields.plan_id;
    start_time: plan_block_weeksFields.start_time;
}
export declare namespace plan_block_week_fitness_componentsFields {
    type block_week_id = number;
    type fitness_component_id = number;
}
export interface plan_block_week_fitness_components {
    block_week_id: plan_block_week_fitness_componentsFields.block_week_id;
    fitness_component_id: plan_block_week_fitness_componentsFields.fitness_component_id;
}
export declare namespace plan_progressesFields {
    type id = number;
    type plan_id = number;
    type user_id = number;
    type deleted = boolean | null;
}
export interface plan_progresses {
    id: plan_progressesFields.id;
    plan_id: plan_progressesFields.plan_id;
    user_id: plan_progressesFields.user_id;
    deleted: plan_progressesFields.deleted;
}
export declare namespace plan_sportsFields {
    type plan_id = number;
    type sport_id = number;
}
export interface plan_sports {
    plan_id: plan_sportsFields.plan_id;
    sport_id: plan_sportsFields.sport_id;
}
export declare namespace plan_user_rolesFields {
    type plan_id = number;
    type user_id = number;
    type role = enum_role | null;
}
export interface plan_user_roles {
    plan_id: plan_user_rolesFields.plan_id;
    user_id: plan_user_rolesFields.user_id;
    role: plan_user_rolesFields.role;
}
export declare namespace platformsFields {
    type platform_id = number;
    type name = string;
}
export interface platforms {
    platform_id: platformsFields.platform_id;
    name: platformsFields.name;
}
export declare namespace platform_versionsFields {
    type version_id = number;
    type platform_id = number;
    type version = string;
    type build = number;
    type support_ends = Date | null;
}
export interface platform_versions {
    version_id: platform_versionsFields.version_id;
    platform_id: platform_versionsFields.platform_id;
    version: platform_versionsFields.version;
    build: platform_versionsFields.build;
    support_ends: platform_versionsFields.support_ends;
}
export declare namespace postsFields {
    type post_id = number;
    type datetime = Date;
    type author_id = number;
    type type = enum_type;
    type deleted = boolean | null;
}
export interface posts {
    post_id: postsFields.post_id;
    datetime: postsFields.datetime;
    author_id: postsFields.author_id;
    type: postsFields.type;
    deleted: postsFields.deleted;
}
export declare namespace post_attachmentsFields {
    type attachment_id = number;
    type post_id = number;
    type name = string;
    type file_uri = string | null;
    type uploaded_at = Date;
    type type = string;
}
export interface post_attachments {
    attachment_id: post_attachmentsFields.attachment_id;
    post_id: post_attachmentsFields.post_id;
    name: post_attachmentsFields.name;
    file_uri: post_attachmentsFields.file_uri;
    uploaded_at: post_attachmentsFields.uploaded_at;
    type: post_attachmentsFields.type;
}
export declare namespace post_messagesFields {
    type message_id = number;
    type post_id = number;
    type message = string;
    type datetime = Date;
    type deleted = boolean | null;
}
export interface post_messages {
    message_id: post_messagesFields.message_id;
    post_id: post_messagesFields.post_id;
    message: post_messagesFields.message;
    datetime: post_messagesFields.datetime;
    deleted: post_messagesFields.deleted;
}
export declare namespace post_repliesFields {
    type reply_id = number;
    type post_id = number;
    type author_id = number;
    type datetime = Date;
    type deleted = boolean | null;
}
export interface post_replies {
    reply_id: post_repliesFields.reply_id;
    post_id: post_repliesFields.post_id;
    author_id: post_repliesFields.author_id;
    datetime: post_repliesFields.datetime;
    deleted: post_repliesFields.deleted;
}
export declare namespace post_reply_messagesFields {
    type message_id = number;
    type reply_id = number;
    type message = string;
    type datetime = Date;
    type deleted = boolean | null;
}
export interface post_reply_messages {
    message_id: post_reply_messagesFields.message_id;
    reply_id: post_reply_messagesFields.reply_id;
    message: post_reply_messagesFields.message;
    datetime: post_reply_messagesFields.datetime;
    deleted: post_reply_messagesFields.deleted;
}
export declare namespace proficienciesFields {
    type proficiency_id = number;
}
export interface proficiencies {
    proficiency_id: proficienciesFields.proficiency_id;
}
export declare namespace proficiency_translationsFields {
    type proficiency_id = number;
    type language_id = number;
    type description = string;
}
export interface proficiency_translations {
    proficiency_id: proficiency_translationsFields.proficiency_id;
    language_id: proficiency_translationsFields.language_id;
    description: proficiency_translationsFields.description;
}
export declare namespace recommendationsFields {
    type recommendation_id = number;
}
export interface recommendations {
    recommendation_id: recommendationsFields.recommendation_id;
}
export declare namespace recommendations_assignedFields {
    type recommendation_id = number;
    type user_id = number;
    type created_at = Date;
    type seen_at = Date | null;
    type feedback = number | null;
}
export interface recommendations_assigned {
    recommendation_id: recommendations_assignedFields.recommendation_id;
    user_id: recommendations_assignedFields.user_id;
    created_at: recommendations_assignedFields.created_at;
    seen_at: recommendations_assignedFields.seen_at;
    feedback: recommendations_assignedFields.feedback;
}
export declare namespace recommendation_translationsFields {
    type recommendation_id = number;
    type language_id = number;
    type message = string | null;
    type supporting_text = string | null;
    type background_info = string | null;
}
export interface recommendation_translations {
    recommendation_id: recommendation_translationsFields.recommendation_id;
    language_id: recommendation_translationsFields.language_id;
    message: recommendation_translationsFields.message;
    supporting_text: recommendation_translationsFields.supporting_text;
    background_info: recommendation_translationsFields.background_info;
}
export declare namespace recommendation_wellness_metricsFields {
    type recommendation_id = number;
    type metric_id = number;
}
export interface recommendation_wellness_metrics {
    recommendation_id: recommendation_wellness_metricsFields.recommendation_id;
    metric_id: recommendation_wellness_metricsFields.metric_id;
}
export declare namespace rolesFields {
    type role_id = number;
    type title = string;
    type permission_level = boolean | null;
}
export interface roles {
    role_id: rolesFields.role_id;
    title: rolesFields.title;
    permission_level: rolesFields.permission_level;
}
export declare namespace rpe_responsesFields {
    type session_id = number;
    type user_id = number;
    type team_id = number;
    type score = number | null;
    type score1to10 = number | null;
}
export interface rpe_responses {
    session_id: rpe_responsesFields.session_id;
    user_id: rpe_responsesFields.user_id;
    team_id: rpe_responsesFields.team_id;
    score: rpe_responsesFields.score;
    score1to10: rpe_responsesFields.score1to10;
}
export declare namespace sessionsFields {
    type session_id = number;
    type datetime = Date;
    type duration = number;
    type title = string | null;
    type type = string;
    type home = boolean;
    type deleted = boolean | null;
    type location = string | null;
    type lat = number | null;
    type lng = number | null;
    type link = number | null;
}
export interface sessions {
    session_id: sessionsFields.session_id;
    datetime: sessionsFields.datetime;
    duration: sessionsFields.duration;
    title: sessionsFields.title;
    type: sessionsFields.type;
    home: sessionsFields.home;
    deleted: sessionsFields.deleted;
    location: sessionsFields.location;
    lat: sessionsFields.lat;
    lng: sessionsFields.lng;
    link: sessionsFields.link;
}
export declare namespace sessions_linksFields {
    type link_id = number;
}
export interface sessions_links {
    link_id: sessions_linksFields.link_id;
}
export declare namespace session_attachmentsFields {
    type attachment_id = number;
    type session_id = number;
    type name = string;
    type file_uri = string | null;
    type uploaded_at = Date;
    type type = string;
}
export interface session_attachments {
    attachment_id: session_attachmentsFields.attachment_id;
    session_id: session_attachmentsFields.session_id;
    name: session_attachmentsFields.name;
    file_uri: session_attachmentsFields.file_uri;
    uploaded_at: session_attachmentsFields.uploaded_at;
    type: session_attachmentsFields.type;
}
export declare namespace session_membersFields {
    type session_id = number;
    type user_id = number;
    type team_id = number;
    type attendance_duration = number | null;
}
export interface session_members {
    session_id: session_membersFields.session_id;
    user_id: session_membersFields.user_id;
    team_id: session_membersFields.team_id;
    attendance_duration: session_membersFields.attendance_duration;
}
export declare namespace session_notesFields {
    type note_id = number;
    type session_id = number;
    type note = string;
    type timestamp = Date;
    type deleted = boolean | null;
}
export interface session_notes {
    note_id: session_notesFields.note_id;
    session_id: session_notesFields.session_id;
    note: session_notesFields.note;
    timestamp: session_notesFields.timestamp;
    deleted: session_notesFields.deleted;
}
export declare namespace sets_repsFields {
    type sets_reps_schemes_id = number;
    type order = number;
    type one_rm_percentage = number | null;
    type reps = number | null;
}
export interface sets_reps {
    sets_reps_schemes_id: sets_repsFields.sets_reps_schemes_id;
    order: sets_repsFields.order;
    one_rm_percentage: sets_repsFields.one_rm_percentage;
    reps: sets_repsFields.reps;
}
export declare namespace sets_reps_schemesFields {
    type sets_reps_schemes_id = number;
    type weekly_one_rm_increase_percentage = number | null;
    type name = string | null;
}
export interface sets_reps_schemes {
    sets_reps_schemes_id: sets_reps_schemesFields.sets_reps_schemes_id;
    weekly_one_rm_increase_percentage: sets_reps_schemesFields.weekly_one_rm_increase_percentage;
    name: sets_reps_schemesFields.name;
}
export declare namespace sportsFields {
    type sport_id = number;
}
export interface sports {
    sport_id: sportsFields.sport_id;
}
export declare namespace sport_translationsFields {
    type sport_id = number;
    type language_id = number;
    type description = string;
}
export interface sport_translations {
    sport_id: sport_translationsFields.sport_id;
    language_id: sport_translationsFields.language_id;
    description: sport_translationsFields.description;
}
export declare namespace teamsFields {
    type team_id = number;
    type org_id = number | null;
    type name = string;
    type image_uri = string | null;
    type image_type = string | null;
    type created_at = Date;
    type deleted = boolean | null;
    type code = string | null;
}
export interface teams {
    team_id: teamsFields.team_id;
    org_id: teamsFields.org_id;
    name: teamsFields.name;
    image_uri: teamsFields.image_uri;
    image_type: teamsFields.image_type;
    created_at: teamsFields.created_at;
    deleted: teamsFields.deleted;
    code: teamsFields.code;
}
export declare namespace team_membersFields {
    type user_id = number;
    type team_id = number;
    type org_id = number;
    type created_at = Date;
    type deleted = boolean | null;
}
export interface team_members {
    user_id: team_membersFields.user_id;
    team_id: team_membersFields.team_id;
    org_id: team_membersFields.org_id;
    created_at: team_membersFields.created_at;
    deleted: team_membersFields.deleted;
}
export declare namespace team_member_profilesFields {
    type team_id = number;
    type user_id = number;
    type position = string;
    type squad_number = number;
    type device_id = string | null;
}
export interface team_member_profiles {
    team_id: team_member_profilesFields.team_id;
    user_id: team_member_profilesFields.user_id;
    position: team_member_profilesFields.position;
    squad_number: team_member_profilesFields.squad_number;
    device_id: team_member_profilesFields.device_id;
}
export declare namespace test_groupsFields {
    type group_id = number;
    type org_id = number;
    type title = string;
    type description = string;
    type deleted = boolean;
}
export interface test_groups {
    group_id: test_groupsFields.group_id;
    org_id: test_groupsFields.org_id;
    title: test_groupsFields.title;
    description: test_groupsFields.description;
    deleted: test_groupsFields.deleted;
}
export declare namespace test_group_exercisesFields {
    type group_id = number;
    type exercise_id = number;
    type removed_time = Date | null;
}
export interface test_group_exercises {
    group_id: test_group_exercisesFields.group_id;
    exercise_id: test_group_exercisesFields.exercise_id;
    removed_time: test_group_exercisesFields.removed_time;
}
export declare namespace test_group_sessionsFields {
    type group_id = number;
    type session_id = number;
    type deleted = boolean;
}
export interface test_group_sessions {
    group_id: test_group_sessionsFields.group_id;
    session_id: test_group_sessionsFields.session_id;
    deleted: test_group_sessionsFields.deleted;
}
export declare namespace tokenFields {
    type id = number;
    type token = string;
    type expiry_date = Date;
    type created_at = Date | null;
    type deleted = boolean;
}
export interface token {
    id: tokenFields.id;
    token: tokenFields.token;
    expiry_date: tokenFields.expiry_date;
    created_at: tokenFields.created_at;
    deleted: tokenFields.deleted;
}
export declare namespace unitsFields {
    type unit_id = number;
    type type_id = number;
    type name = string;
    type standard = boolean | null;
}
export interface units {
    unit_id: unitsFields.unit_id;
    type_id: unitsFields.type_id;
    name: unitsFields.name;
    standard: unitsFields.standard;
}
export declare namespace unit_typesFields {
    type unit_type_id = number;
    type description = string;
}
export interface unit_types {
    unit_type_id: unit_typesFields.unit_type_id;
    description: unit_typesFields.description;
}
export declare namespace usersFields {
    type user_id = number;
    type email = string | null;
    type fname = string;
    type lname = string;
    type image_uri = string | null;
    type timezone = string | null;
    type hash = string;
    type token = string | null;
    type force_reauth = boolean | null;
    type password_reset_token = string | null;
    type created_at = Date;
    type deleted = boolean | null;
    type email_verified = boolean;
    type email_verification_token_id = number | null;
}
export interface users {
    user_id: usersFields.user_id;
    email: usersFields.email;
    fname: usersFields.fname;
    lname: usersFields.lname;
    image_uri: usersFields.image_uri;
    timezone: usersFields.timezone;
    hash: usersFields.hash;
    token: usersFields.token;
    force_reauth: usersFields.force_reauth;
    password_reset_token: usersFields.password_reset_token;
    created_at: usersFields.created_at;
    deleted: usersFields.deleted;
    email_verified: usersFields.email_verified;
    email_verification_token_id: usersFields.email_verification_token_id;
}
export declare namespace wellness_check_insFields {
    type wellness_check_in_id = number;
    type metric_id = number | null;
    type user_id = number;
    type created_at = Date;
    type seen_at = Date | null;
    type deleted = boolean;
}
export interface wellness_check_ins {
    wellness_check_in_id: wellness_check_insFields.wellness_check_in_id;
    metric_id: wellness_check_insFields.metric_id;
    user_id: wellness_check_insFields.user_id;
    created_at: wellness_check_insFields.created_at;
    seen_at: wellness_check_insFields.seen_at;
    deleted: wellness_check_insFields.deleted;
}
export declare namespace wellness_commentsFields {
    type post_id = number;
    type user_id = number;
    type deleted = boolean | null;
}
export interface wellness_comments {
    post_id: wellness_commentsFields.post_id;
    user_id: wellness_commentsFields.user_id;
    deleted: wellness_commentsFields.deleted;
}
export declare namespace wellness_metricsFields {
    type metric_id = number;
    type order = number;
    type name = string | null;
    type deleted = boolean | null;
    type derived = boolean | null;
}
export interface wellness_metrics {
    metric_id: wellness_metricsFields.metric_id;
    order: wellness_metricsFields.order;
    name: wellness_metricsFields.name;
    deleted: wellness_metricsFields.deleted;
    derived: wellness_metricsFields.derived;
}
export declare namespace wellness_metric_statisticsFields {
    type metric_id = number;
    type user_id = number;
    type stat_id = number;
    type datetime = Date;
}
export interface wellness_metric_statistics {
    metric_id: wellness_metric_statisticsFields.metric_id;
    user_id: wellness_metric_statisticsFields.user_id;
    stat_id: wellness_metric_statisticsFields.stat_id;
    datetime: wellness_metric_statisticsFields.datetime;
}
export declare namespace wellness_metric_translationsFields {
    type metric_id = number;
    type language_id = number;
    type name = string;
    type coach_description = string;
    type athlete_description = string;
    type question = string;
    type min_label = string;
    type low_label = string | null;
    type mid_label = string | null;
    type high_label = string | null;
    type max_label = string;
    type deleted = boolean | null;
}
export interface wellness_metric_translations {
    metric_id: wellness_metric_translationsFields.metric_id;
    language_id: wellness_metric_translationsFields.language_id;
    name: wellness_metric_translationsFields.name;
    coach_description: wellness_metric_translationsFields.coach_description;
    athlete_description: wellness_metric_translationsFields.athlete_description;
    question: wellness_metric_translationsFields.question;
    min_label: wellness_metric_translationsFields.min_label;
    low_label: wellness_metric_translationsFields.low_label;
    mid_label: wellness_metric_translationsFields.mid_label;
    high_label: wellness_metric_translationsFields.high_label;
    max_label: wellness_metric_translationsFields.max_label;
    deleted: wellness_metric_translationsFields.deleted;
}
export declare namespace wellness_responsesFields {
    type date = Date;
    type user_id = number;
    type metric_id = number;
    type score = number;
}
export interface wellness_responses {
    date: wellness_responsesFields.date;
    user_id: wellness_responsesFields.user_id;
    metric_id: wellness_responsesFields.metric_id;
    score: wellness_responsesFields.score;
}
export declare namespace wellness_schedulesFields {
    type team_id = number;
    type mon = boolean | null;
    type tue = boolean | null;
    type wed = boolean | null;
    type thu = boolean | null;
    type fri = boolean | null;
    type sat = boolean | null;
    type sun = boolean | null;
    type time = string | null;
    type email_notifications = boolean | null;
}
export interface wellness_schedules {
    team_id: wellness_schedulesFields.team_id;
    mon: wellness_schedulesFields.mon;
    tue: wellness_schedulesFields.tue;
    wed: wellness_schedulesFields.wed;
    thu: wellness_schedulesFields.thu;
    fri: wellness_schedulesFields.fri;
    sat: wellness_schedulesFields.sat;
    sun: wellness_schedulesFields.sun;
    time: wellness_schedulesFields.time;
    email_notifications: wellness_schedulesFields.email_notifications;
}
export declare namespace wellness_surveysFields {
    type metric_id = number;
    type team_id = number;
}
export interface wellness_surveys {
    metric_id: wellness_surveysFields.metric_id;
    team_id: wellness_surveysFields.team_id;
}
export declare namespace workout_exercisesFields {
    type workout_exercise_id = number;
    type workout_id = number;
    type exercise_id = number;
    type sets_reps_schemes_id = number;
    type order = number;
}
export interface workout_exercises {
    workout_exercise_id: workout_exercisesFields.workout_exercise_id;
    workout_id: workout_exercisesFields.workout_id;
    exercise_id: workout_exercisesFields.exercise_id;
    sets_reps_schemes_id: workout_exercisesFields.sets_reps_schemes_id;
    order: workout_exercisesFields.order;
}
