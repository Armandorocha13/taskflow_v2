package br.com.taskflow.controle;

import br.com.taskflow.entidade.Membro;
import br.com.taskflow.servico.MembroServico;
import br.com.taskflow.servico.TarefaServico;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/membro")
public class PaginaMembroControle {

    private final TarefaServico tarefaServico;
    private final MembroServico membroServico;

    public PaginaMembroControle(TarefaServico tarefaServico, MembroServico membroServico) {
        this.tarefaServico = tarefaServico;
        this.membroServico = membroServico;
    }

    @GetMapping("/tarefas")
    public String listarTarefas(Model model, HttpSession session) {
        Long membroId = (Long) session.getAttribute("membroId");
        if (membroId == null)
            return "redirect:/login";

        Membro m = membroServico.listarTodos().stream()
                .filter(x -> x.getId().equals(membroId))
                .findFirst()
                .orElse(null);

        if (m == null)
            return "redirect:/login";

        model.addAttribute("membro", m);
        model.addAttribute("tarefas", tarefaServico.listarPorMembro(m));
        return "membro";
    }

    @PostMapping("/tarefas/alternar/{id}")
    public String alternarTarefa(@PathVariable Long id, HttpSession session) {
        if (session.getAttribute("membroId") == null)
            return "redirect:/login";
        tarefaServico.alternarStatus(id);
        return "redirect:/membro/tarefas";
    }
}
