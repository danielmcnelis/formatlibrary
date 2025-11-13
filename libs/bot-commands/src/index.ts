import activity from './lib/activity'
import bracket from './lib/bracket'
import cancel from './lib/cancel.js'
import card from './lib/card'
import close from './lib/close'
import coin from './lib/coin'
import combine from './lib/combine'
import coverage from './lib/coverage'
import create from './lib/create'
import deck from './lib/deck'
import destroy from './lib/destroy'
import dice from './lib/dice'
import drop from './lib/drop'
import end from './lib/end'
import entries from './lib/entries'
import exit from './lib/exit'
import film from './lib/film'
import fix from './lib/fix'
import flair from './lib/flair'
import format from './lib/format'
import h2h from './lib/h2h'
import help from './lib/help'
import history from './lib/history'
import info from './lib/info'
import join from './lib/join'
import leaderboard from './lib/leaderboard'
import legal from './lib/legal'
import lobby from './lib/lobby'
import loss from './lib/loss'
import manual from './lib/manual'
import mod from './lib/mod'
import noshow from './lib/noshow'
import open from './lib/open'
import ping from './lib/ping'
import points from './lib/points'
import pools from './lib/pools'
import profile from './lib/profile'
import queue from './lib/queue'
import rated from './lib/rated'
import recalculate from './lib/recalculate'
import records from './lib/records'
import remove from './lib/remove'
import replay from './lib/replay'
import reset from './lib/reset'
import rng from './lib/rng'
import role from './lib/role'
import series from './lib/series'
import settimer from './lib/settimer'
import settings from './lib/settings'
import signup from './lib/signup'
import standings from './lib/standings'
import start from './lib/start'
import stats from './lib/stats'
import tiebreakers from './lib/tiebreakers'
import timer from './lib/timer'
import team from './lib/team'
import teams from './lib/teams'
import test from './lib/test'
import tournaments from './lib/tournaments'
import trivia from './lib/trivia'
import undo from './lib/undo'
import username from './lib/username'

export default {
    formatLibraryCommands: {
        combine,
        coverage,
        fix,
        flair,
        queue,
        recalculate,
        series,
        trivia,
        test
    },
    globalCommands: {
        activity,
        bracket,
        cancel,
        card,
        close,
        coin,
        create,
        deck,
        destroy,
        dice,
        drop,
        end,
        entries,
        exit,
        film,
        format,
        h2h,
        help,
        history,
        info,
        join,
        leaderboard,
        legal,
        lobby,
        loss,
        manual,
        mod,
        noshow,
        open,
        ping,
        points,
        pools,
        profile,
        rated,
        records,
        remove,
        replay,
        reset,
        rng,
        role,
        settimer,
        settings,
        signup,
        standings,
        start,
        stats,
        team,
        teams,
        tiebreakers,
        timer,
        tournaments,
        undo,
        username
    }
}